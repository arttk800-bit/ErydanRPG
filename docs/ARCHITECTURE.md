# Architecture

Input/AI -> validate action -> execute -> effects/damage -> death/retreat -> lifecycle -> telemetry -> next turn.

One authoritative GameState. Combat never touches DOM. UI only reads state/dispatches actions. AI uses the same legal-action API as player control. Simulation runs headless. Balance lives in data files. Diagnostics observe events instead of wrapping combat functions. Fixed seeds are regression tests.
