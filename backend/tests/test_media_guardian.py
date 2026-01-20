
import asyncio
from backend.agents.media_guardian import guardian

async def test_guardian():
    print("\n--- Phase 5.2 Verification: MediaGuardian Autonomous Repair ---")
    
    # 1. Audit the library
    audit_res = await guardian.audit_library()
    print(f"   Audit Result: {audit_res['status']}")
    print(f"   Items needing repair: {audit_res.get('missing_count', 0)}")
    
    if audit_res.get('missing_count', 0) > 0:
        # 2. Repair a small batch (just 1 for safety during test)
        repair_res = await guardian.repair_batch(limit=1)
        print(f"   Repair Result: {repair_res['status']}")
    else:
        print("   [OK] No repair needed. Data integrity 100%.")

if __name__ == "__main__":
    asyncio.run(test_guardian())
