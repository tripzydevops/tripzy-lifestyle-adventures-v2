import os
import subprocess
import json
from datetime import datetime

def run_script(script_path):
    print(f"🚀 Running: {script_path}")
    result = subprocess.run(["python", script_path], capture_output=True, text=True)
    return {
        "status": "success" if result.returncode == 0 else "failed",
        "output": result.stdout,
        "error": result.stderr
    }

def main():
    report = {
        "timestamp": datetime.now().isoformat(),
        "checks": {}
    }

    # List of audits to run
    audit_scripts = [
        "backend/check_schema.py",
        "backend/check_storage.py",
        "backend/verify_metadata.py"
    ]

    for script in audit_scripts:
        script_full_path = os.path.join(os.getcwd(), script)
        if os.path.exists(script_full_path):
            report["checks"][script] = run_script(script_full_path)
        else:
            report["checks"][script] = {"status": "missing"}

    # Save report
    report_path = "backend/data_integrity_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=4)
    
    print(f"✅ Audit complete. Report saved to {report_path}")

if __name__ == "__main__":
    main()
