import sys
import time
import os
import asyncio
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from dotenv import load_dotenv, find_dotenv

# Ensure backend module is accessible
sys.path.append(os.path.join(os.getcwd(), '..'))

from backend.agents.scribe_agent import scribe_agent

load_dotenv(find_dotenv())

class ScribeEventHandler(FileSystemEventHandler):
    """
    Handles file system events and triggers the Scribe Agent.
    """
    def __init__(self):
        self.last_triggered = 0
        self.debounce_seconds = 10  # Wait 10 seconds after last specific change before triggering
        self.changed_files = set()

    def on_modified(self, event):
        if event.is_directory:
            return
        
        # Ignore non-code files and git/venv junk
        if "__pycache__" in event.src_path or ".git" in event.src_path or ".venv" in event.src_path:
            return

        if not (event.src_path.endswith(".py") or event.src_path.endswith(".ts") or event.src_path.endswith(".tsx")):
            return

        print(f"👀 Detected change in: {event.src_path}")
        self.changed_files.add(event.src_path)
        self.last_triggered = time.time()

    async def process_changes(self):
        """
        Checks if enough time has passed since the last change to trigger a log.
        """
        while True:
            await asyncio.sleep(2)
            
            if self.changed_files and (time.time() - self.last_triggered > self.debounce_seconds):
                print(f"⚡ Stability detected. Triggering Scribe Agent for {len(self.changed_files)} files...")
                
                files_snapshot = list(self.changed_files)
                self.changed_files.clear()
                
                # Construct a summary of what changed
                summary = f"Developer modified {len(files_snapshot)} files:\n"
                for f in files_snapshot:
                    filename = os.path.basename(f)
                    summary += f"- {filename}\n"
                
                print("📝 Scribe is drafting a Design Log...")
                try:
                    # In a real scenario, we would read the diffs here.
                    # For now, we pass the file list as the 'task state'
                    result = await scribe_agent.track_milestone(
                        task_summary=f"Codebase modification event: {summary}",
                        current_state={"modified_files": files_snapshot, "timestamp": time.time()}
                    )
                    
                    if result:
                        print(f"✅ Design Log created: {result}")
                    else:
                        print("ℹ️ Scribe decided this change was too minor for a full log.")
                        
                except Exception as e:
                    print(f"❌ Scribe Error: {e}")

async def main():
    print("🔭 Tripzy R&D Watcher Started. Waiting for code changes...")
    print("   (Monitors .py, .ts, .tsx files)")
    
    event_handler = ScribeEventHandler()
    observer = Observer()
    path = os.getcwd() # Watch current directory (project root)
    
    observer.schedule(event_handler, path, recursive=True)
    observer.start()

    # Run the async processor loop alongside the observer
    try:
        await event_handler.process_changes()
    except KeyboardInterrupt:
        observer.stop()
    
    observer.join()

if __name__ == "__main__":
    # Windows/Asyncio workaround for selector loop
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(main())
