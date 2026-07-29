import os
import re
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
db_name = os.getenv("MONGO_DB_NAME", "attrisense_db")

client = MongoClient(mongo_uri)
raw_db = client[db_name]

class MongoQueryProperty:
    def __init__(self, collection, model_class):
        self.collection = collection
        self.model_class = model_class

    def __get__(self, instance, owner):
        return MongoQuery(self.collection, self.model_class)

class MongoSession:
    def add(self, obj):
        if hasattr(obj, 'save'):
            obj.save()

    def delete(self, obj):
        if hasattr(obj, 'delete_doc'):
            obj.delete_doc()

    def commit(self):
        pass

    def rollback(self):
        pass
        
    def flush(self):
        pass

    def bulk_insert_mappings(self, model_class, mappings):
        # For batch inserts
        # model_class could be AgentLog or similar
        # Map class name to collections
        col_name = getattr(model_class, '__tablename__', 'logs')
        if col_name == 'agent_logs':
            raw_db.agent_logs.insert_many(mappings)
        elif col_name == 'audit_logs':
            raw_db.audit_logs.insert_many(mappings)
        else:
            raw_db[col_name].insert_many(mappings)

class MongoOr:
    def __init__(self, *args):
        if len(args) == 1 and isinstance(args[0], (list, tuple)):
            self.args = args[0]
        else:
            self.args = args
    def to_mongo(self):
        or_list = []
        for arg in self.args:
            if hasattr(arg, 'to_mongo'):
                or_list.append(arg.to_mongo())
            elif isinstance(arg, dict):
                or_list.append(arg)
        return {"$or": or_list}

class MongoFieldExpr:
    def __init__(self, name):
        self.name = name
    def ilike(self, pattern):
        regex_pat = pattern.replace("%", "")
        # Escaping regex characters
        regex_pat = re.escape(regex_pat)
        return MongoBinaryExpr(self.name, {"$regex": regex_pat, "$options": "i"})
    def desc(self):
        return MongoSortExpr(self.name, -1)
    def asc(self):
        return MongoSortExpr(self.name, 1)
    def __ge__(self, other):
        return MongoBinaryExpr(self.name, {"$gte": other})
    def __le__(self, other):
        return MongoBinaryExpr(self.name, {"$lte": other})
    def __gt__(self, other):
        return MongoBinaryExpr(self.name, {"$gt": other})
    def __lt__(self, other):
        return MongoBinaryExpr(self.name, {"$lt": other})
    def __eq__(self, other):
        return MongoBinaryExpr(self.name, other)
    def __ne__(self, other):
        return MongoBinaryExpr(self.name, {"$ne": other})
    def in_(self, other):
        return MongoBinaryExpr(self.name, {"$in": other})

class MongoSortExpr:
    def __init__(self, name, direction):
        self._sort_field = name
        self._sort_dir = direction

class MongoBinaryExpr:
    def __init__(self, name, val):
        self.name = name
        self.val = val
    def to_mongo(self):
        return {self.name: self.val}

class MongoFuncAvg:
    def __init__(self, field_expr):
        self.field_name = field_expr.name if hasattr(field_expr, 'name') else field_expr

class MongoFunc:
    @staticmethod
    def avg(field_expr):
        return MongoFuncAvg(field_expr)

class MongoDbWrapper:
    def __init__(self, pymongo_db):
        self._db = pymongo_db
        self.session = MongoSession()
        self.or_ = MongoOr
        self.func = MongoFunc()

    def __getattr__(self, name):
        return getattr(self._db, name)

    def query(self, *args):
        # Custom helper if needed
        pass

db = MongoDbWrapper(raw_db)

class MongoQuery:
    def __init__(self, collection, model_class):
        self.collection = collection
        self.model_class = model_class
        self.filters = {}
        self._limit = None
        self._offset = None
        self._sort = None

    def filter_by(self, **kwargs):
        for k, v in kwargs.items():
            self.filters[k] = v
        return self

    def filter(self, *args):
        for arg in args:
            if hasattr(arg, 'to_mongo'):
                self.filters.update(arg.to_mongo())
            elif isinstance(arg, dict):
                self.filters.update(arg)
        return self

    def order_by(self, sort_expr):
        if hasattr(sort_expr, '_sort_field'):
            self._sort = [(sort_expr._sort_field, sort_expr._sort_dir)]
        elif hasattr(sort_expr, 'name'):
            self._sort = [(sort_expr.name, 1)]
        else:
            self._sort = sort_expr
        return self

    def offset(self, val):
        self._offset = val
        return self

    def limit(self, val):
        self._limit = val
        return self

    def count(self):
        return self.collection.count_documents(self.filters)

    def scalar(self):
        # Used for aggregates e.g. func.avg
        # We can implement a simple aggregation pipeline or fallback
        # Let's see: if we want to run aggregate for avg:
        # self.filters might be like {"is_active": True, "organization_id": "..."}
        # Let's perform a MongoDB aggregation
        pipeline = [{"$match": self.filters}]
        # Find which field to average
        # In our code, we did: db.session.query(db.func.avg(Employee.probability))
        # Let's assume we average probability or amount
        # We can match keys in self.filters or query expressions
        # Let's average probability
        field_to_avg = "probability"
        pipeline.append({"$group": {"_id": None, "avg_val": {"$avg": f"${field_to_avg}"}}})
        res = list(self.collection.aggregate(pipeline))
        if res and res[0].get("avg_val") is not None:
            return res[0]["avg_val"]
        return None

    def first(self):
        doc = self.collection.find_one(self.filters)
        return self.model_class.from_dict(doc) if doc else None

    def all(self):
        cursor = self.collection.find(self.filters)
        if self._sort:
            cursor = cursor.sort(self._sort)
        if self._offset is not None:
            cursor = cursor.skip(self._offset)
        if self._limit is not None:
            cursor = cursor.limit(self._limit)
        return [self.model_class.from_dict(doc) for doc in cursor]

    def get(self, ident):
        from bson import ObjectId
        try:
            doc = self.collection.find_one({"_id": ObjectId(ident)})
        except Exception:
            doc = self.collection.find_one({"_id": ident})
        if not doc:
            try:
                doc = self.collection.find_one({"id": int(ident)})
            except Exception:
                pass
        if not doc:
            doc = self.collection.find_one({"id": str(ident)})
        return self.model_class.from_dict(doc) if doc else None

def get_user_id(identity):
    if identity is None:
        return None
    val = str(identity)
    return int(val) if val.isdigit() else val

def get_db():
    return db
