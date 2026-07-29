def test_retention_tracker_endpoint(client, auth_headers):
    res = client.get("/api/v1/analytics/retention-tracker", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "metrics" in data
    assert "campaigns" in data
    assert data["metrics"]["successRate"] == 78


def test_dept_detail_endpoint(client, auth_headers):
    from app.services.csv_engine import CsvEngine
    engine = CsvEngine.instance()
    roles = engine.df["job_role"].dropna().unique()
    if len(roles) > 0:
        dept = roles[0]
        res = client.get(f"/api/v1/analytics/dept/{dept}", headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()["data"]
        assert data["department"] == dept
        assert "overtimePct" in data



