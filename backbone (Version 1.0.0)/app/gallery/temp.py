import pandas as pd
import random
from datetime import datetime, timedelta

# Helper function to generate a random date between two dates
def random_date(start, end):
    return start + timedelta(days=random.randint(0, (end - start).days))

# Number of synthetic rows to generate
num_rows = 100

# Define possible values for various columns
patient_ids = [f"P{i:04d}" for i in range(1, num_rows + 1)]
genders = ["Male", "Female"]
anesthesia_types = ["General", "Regional", "Local", "Sedation"]
asa_scores = [1, 2, 3, 4, 5]
complication_options = ["None", "Bleeding", "Infection", "Adverse Reaction", "Wound Dehiscence"]
outcomes = ["Successful", "Complications", "Failed"]
discharge_dispositions = ["Home", "Rehabilitation Facility", "Skilled Nursing Facility"]

procedure_codes = [f"PROC{str(i).zfill(3)}" for i in range(1, 11)]
procedure_descriptions = [
    "Appendectomy", "Cholecystectomy", "Hernia Repair", "CABG", "Hip Replacement", 
    "Knee Replacement", "Laparoscopy", "Thyroidectomy", "Mastectomy", "Colectomy"
]
primary_surgeons = ["Dr. John Smith", "Dr. Mary Johnson", "Dr. Alex Brown", "Dr. Linda Williams", "Dr. Michael Davis"]
assistant_surgeons = ["Dr. Robert Wilson", "Dr. Patricia Taylor", "Dr. David Anderson", "Dr. Barbara Thomas", None]
anesthesiologists = ["Dr. Sarah Miller", "Dr. Christopher Moore", "Dr. Jessica Martinez", "Dr. Daniel Garcia", "Dr. Emily Rodriguez"]

# Define date ranges for Date of Birth and Date of Surgery
dob_start = datetime(1940, 1, 1)
dob_end = datetime(2005, 12, 31)
surgery_start = datetime(2022, 1, 1)
surgery_end = datetime(2025, 12, 31)

# Generate synthetic data
data = []
for i in range(num_rows):
    dob = random_date(dob_start, dob_end)
    surgery_date = random_date(surgery_start, surgery_end)
    proc_index = random.randint(0, len(procedure_codes) - 1)
    
    row = {
        "Patient ID": patient_ids[i],
        "Date of Birth": dob.strftime("%Y-%m-%d"),
        "Gender": random.choice(genders),
        "Date of Surgery": surgery_date.strftime("%Y-%m-%d"),
        "Procedure Code": procedure_codes[proc_index],
        "Procedure Description": procedure_descriptions[proc_index],
        "Primary Surgeon": random.choice(primary_surgeons),
        "Assistant Surgeon": random.choice(assistant_surgeons) or "",  # Empty string if None
        "Anesthesiologist": random.choice(anesthesiologists),
        "Surgical Duration (minutes)": random.randint(30, 240),
        "Anesthesia Type": random.choice(anesthesia_types),
        "ASA Score": random.choice(asa_scores),
        "Complications": random.choice(complication_options),
        "Outcome": random.choice(outcomes),
        "Length of Stay (days)": random.randint(0, 14),
        "Discharge Disposition": random.choice(discharge_dispositions),
        "Readmission within 30 Days": random.choice(["Yes", "No"])
    }
    data.append(row)

# Create DataFrame
df = pd.DataFrame(data)

# Write DataFrame to an Excel file
output_filename = "synthetic_surgical_operations_data.xlsx"
df.to_excel(output_filename, index=False)

print(f"Excel file '{output_filename}' has been created with {num_rows} rows of synthetic data.")