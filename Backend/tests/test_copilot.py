def test_slack_tool_execute_endpoint(client, auth_headers):
    # Save a mock employee to MongoDB test database first
    from app.models.employee import Employee
    from app.db import raw_db
    
    raw_db.employees.delete_many({}) # Clean up
    
    emp = Employee(
        name="Sarah Jenkins",
        email="s.jenkins@comp.com",
        dept="Engineering",
        role="Senior Developer",
        tenure="2.5 yrs",
        overtime_hrs=12.0,
        salary_gap=-15.0,
        employee_id="EMP-0012",
        organization_id="org-comp-a",
        probability=75.0,
        status="High",
        primary_factor="Workload & Overtime"
    )
    emp.save()

    res = client.post("/api/v1/copilot/tool-execute/slack", headers=auth_headers, json={
        "employeeId": "EMP-0012"
    })
    assert res.status_code == 200
    assert res.get_json()["success"] is True

def test_calendar_tool_execute_endpoint(client, auth_headers):
    res = client.post("/api/v1/copilot/tool-execute/calendar", headers=auth_headers, json={
        "employeeId": "EMP-0012"
    })
    assert res.status_code == 200
    assert res.get_json()["success"] is True
