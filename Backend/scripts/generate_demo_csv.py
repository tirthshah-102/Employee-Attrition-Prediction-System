import csv
import random

# Headers matching the project's CSV format
headers = [
    "Employee ID", "Name", "Email", "Age", "Gender", "Job Role", "Job Level",
    "Yearly Income ($)", "Years at Company", "Job Satisfaction", "Work-Life Balance",
    "Overtime", "Performance Rating", "Number of Promotions", "Attrition_Score",
    "Predicted_Score", "Risk_Category", "Predicted_Risk"
]

first_names = ["Arjun", "Neha", "Rohan", "Priya", "Amit", "Karan", "Siddharth", "Anjali", "Vikram", "Aditi", "Rahul", "Pooja", "John", "Sarah", "Michael", "Emily", "David", "Jessica", "James", "Olivia"]
last_names = ["Sharma", "Verma", "Gupta", "Mehta", "Patel", "Singh", "Kumar", "Joshi", "Sen", "Nair", "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson"]
genders = ["Male", "Female", "Non-binary"]
departments = ["Engineering", "Sales & BD", "Marketing", "Product Management", "Finance", "Human Resources"]
levels = ["Entry", "Mid-Level", "Senior", "Lead", "Executive"]
satisfaction_levels = ["Low", "Medium", "High"]
balance_levels = ["Poor", "Average", "Good"]
overtimes = ["Yes", "No"]
performance_ratings = ["Low", "Below Average", "Average", "High"]

employees = []

# Generate 200 employees
for i in range(200):
    emp_id = 20000 + i
    name = f"{random.choice(first_names)} {random.choice(last_names)}"
    email = f"{name.lower().replace(' ', '')}{i}@attrisense-demo.com"
    age = random.randint(22, 58)
    gender = random.choice(genders)
    job_role = random.choice(departments)
    job_level = random.choice(levels)
    yearly_income = random.randint(3000, 25000)
    years_at_company = random.randint(1, 15)
    job_satisfaction = random.choice(satisfaction_levels)
    work_life_balance = random.choice(balance_levels)
    overtime = random.choice(overtimes)
    performance_rating = random.choice(performance_ratings)
    num_promotions = random.randint(0, 3)
    
    # Guarantee structured attrition risk scores for perfect visual breakdown
    if i % 5 == 0:
        predicted_score = round(random.uniform(75.0, 95.0), 2)
    elif i % 5 == 1:
        predicted_score = round(random.uniform(45.0, 64.0), 2)
    else:
        predicted_score = round(random.uniform(10.0, 34.0), 2)
        
    attrition_score = round(predicted_score + random.uniform(-2.0, 2.0), 2)
    attrition_score = min(max(attrition_score, 5.0), 99.0)
    predicted_score = min(max(predicted_score, 5.0), 99.0)
    
    if predicted_score >= 70.0:
        risk_cat = "High"
    elif predicted_score >= 40.0:
        risk_cat = "Medium"
    else:
        risk_cat = "Low"
        
    predicted_risk = risk_cat
    
    employees.append([
        emp_id, name, email, age, gender, job_role, job_level,
        yearly_income, years_at_company, job_satisfaction, work_life_balance,
        overtime, performance_rating, num_promotions, attrition_score,
        predicted_score, risk_cat, predicted_risk
    ])

# Save to CSV
import os
output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/demo_200_employees.csv"))
with open(output_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    writer.writerows(employees)

print(f"Successfully generated 200 employee records at: {output_path}")
