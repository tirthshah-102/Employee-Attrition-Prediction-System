from marshmallow import Schema, fields, validate, post_load

class LoginSchema(Schema):
    email = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    password = fields.Str(required=True, validate=validate.Length(min=1))
    totpCode = fields.Str(required=False, allow_none=True)

class RegisterSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    password = fields.Str(required=True, validate=validate.Length(min=6, max=100))
    role = fields.Str(required=False, validate=validate.OneOf({"hr", "admin", "manager", "employee"}))
    organizationId = fields.Str(required=False, validate=validate.Length(min=2, max=50))

class ChangePasswordSchema(Schema):
    currentPassword = fields.Str(required=True, validate=validate.Length(min=1))
    newPassword = fields.Str(required=True, validate=validate.Length(min=6, max=100))

class EmployeeSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True, validate=validate.Length(min=3, max=100))
    dept = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    role = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    tenure = fields.Str(required=False, allow_none=True)
    overtimeHrs = fields.Float(required=False, validate=validate.Range(min=0.0, max=168.0))
    salaryGap = fields.Float(required=False, validate=validate.Range(min=-100.0, max=100.0))
    overtime_hrs = fields.Float(required=False, validate=validate.Range(min=0.0, max=168.0))
    salary_gap = fields.Float(required=False, validate=validate.Range(min=-100.0, max=100.0))
    manager_feedback = fields.Float(required=False, validate=validate.Range(min=0.0, max=10.0))
    growth_index = fields.Float(required=False, validate=validate.Range(min=0.0, max=10.0))
    location = fields.Str(required=False, allow_none=True)
    rating = fields.Float(required=False, validate=validate.Range(min=0.0, max=5.0))

class EmployeeUpdateSchema(Schema):
    name = fields.Str(required=False, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=False, validate=validate.Length(min=3, max=100))
    dept = fields.Str(required=False, validate=validate.Length(min=2, max=100))
    role = fields.Str(required=False, validate=validate.Length(min=2, max=100))
    tenure = fields.Str(required=False, allow_none=True)
    overtimeHrs = fields.Float(required=False, validate=validate.Range(min=0.0, max=168.0))
    salaryGap = fields.Float(required=False, validate=validate.Range(min=-100.0, max=100.0))
    overtime_hrs = fields.Float(required=False, validate=validate.Range(min=0.0, max=168.0))
    salary_gap = fields.Float(required=False, validate=validate.Range(min=-100.0, max=100.0))
    manager_feedback = fields.Float(required=False, validate=validate.Range(min=0.0, max=10.0))
    growth_index = fields.Float(required=False, validate=validate.Range(min=0.0, max=10.0))
    location = fields.Str(required=False, allow_none=True)
    rating = fields.Float(required=False, validate=validate.Range(min=0.0, max=5.0))
    managerId = fields.Str(required=False, allow_none=True)
    kanbanStatus = fields.Str(required=False, validate=validate.OneOf({"NEW", "IN_PROGRESS", "MITIGATED"}))
