def test_admin_only_routes_unauthorized(client):
    # Call user registration without token
    res = client.post("/api/v1/auth/users", json={"name": "New User", "email": "new@comp.com"})
    assert res.status_code == 401
    
    # Call user registration with manager token (must return 403 Forbidden)
    # But wait, let's make sure we test with headers fixture.
    
def test_admin_only_routes_forbidden_for_hr(client, manager_headers):
    # Call user registration with manager headers (role: hr, not admin)
    res = client.post("/api/v1/auth/users", headers=manager_headers, json={"name": "New User", "email": "new@comp.com"})
    assert res.status_code == 403
    assert "not authorised" in res.get_json()["message"].lower()

def test_admin_only_routes_allowed_for_admin(client, auth_headers):
    # Register a new user using admin credentials
    res = client.post("/api/v1/auth/users", headers=auth_headers, json={
        "name": "New Developer",
        "email": "dev-unique@comp.com",
        "role": "HR Manager"
    })
    assert res.status_code == 201
    assert res.get_json()["success"] is True
