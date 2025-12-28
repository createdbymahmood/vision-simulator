# Frontend DDD + SOLID Reference

## Starter patterns
- **New feature**: write types + use-cases first, then ports, then adapters, then hook + UI. Start with happy path, then error states.  
- **Refactor**: slice out a domain folder, move business logic into `core`, wrap side effects in ports/adapters, and thin the component; keep exports stable via `index.ts`.

## Domain slice template (React/TS)
```
src/domains/tasks/
  core/
    types.ts           // domain types + invariants
    use-cases/         // pure functions; no IO
  ports/
    task-repo.ts       // interfaces for data + side-effects
  adapters/
    http-task-repo.ts  // fetch/axios implementation of TaskRepo
    local-task-repo.ts // optional alternative
  ui/
    useTasks.ts        // hook wiring use-cases + adapters
    TasksView.tsx      // thin component
  index.ts             // public entry exports hook/component/types
```
- Only `index.ts` should be imported by other domains/features.
- Keep cross-domain utilities in `src/shared/` only when truly shared.

## Use-case skeleton
```ts
// core/use-cases/saveTask.ts
import { Task, TaskRepo } from '../types';

export type SaveTaskInput = { task: Task };
export type SaveTask = (input: SaveTaskInput) => Promise<Result<void>>;

export function makeSaveTask(deps: { repo: TaskRepo }): SaveTask {
  return async ({ task }) => {
    if (!task.title.trim()) return err('empty_title');
    await deps.repo.save(task);
    return ok();
  };
}
```
- Pure, side-effect-free except through injected ports.  
- Return typed domain errors instead of throwing transport errors.

## Port + adapter pattern
```ts
// ports/task-repo.ts
export interface TaskRepo {
  list(): Promise<Task[]>;
  save(task: Task): Promise<void>;
}

// adapters/http-task-repo.ts
export function makeHttpTaskRepo(apiBase: string, client = fetch): TaskRepo {
  return {
    async list() {
      const res = await client(`${apiBase}/tasks`);
      const json = await res.json();
      return json.map(deserializeTask);
    },
    async save(task) {
      await client(`${apiBase}/tasks`, { method: 'POST', body: JSON.stringify(task) });
    },
  };
}
```
- Keep serialization mapping in adapters; do not leak transport shapes upstream.
- Swap adapters in tests (e.g., in-memory repo) to keep UI fast and deterministic.

## Hook + component split
```ts
// ui/useTasks.ts
import { makeHttpTaskRepo } from '../adapters/http-task-repo';
import { makeSaveTask } from '../core/use-cases/saveTask';

export function useTasks() {
  const repo = useMemo(() => makeHttpTaskRepo('/api'), []);
  const saveTask = useMemo(() => makeSaveTask({ repo }), [repo]);
  const [state, setState] = useState<UiState>({ status: 'idle', items: [] });

  const load = useCallback(async () => { ...call repo.list + setState... }, [repo]);
  const save = useCallback(async (task) => { await saveTask({ task }); await load(); }, [saveTask, load]);

  return { state, load, save };
}

// ui/TasksView.tsx
export function TasksView() {
  const { state, load, save } = useTasks();
  useEffect(() => { load(); }, [load]);
  return <TasksScreen {...state} onSave={save} />;
}
```
- Hooks orchestrate use-cases; components render.  
- Keep effectful code in hooks; keep JSX clean and prop-driven.

## UI sizing + Tailwind hygiene
- Target ~150–200 lines per component; split into subcomponents when bulky.  
- Keep local subcomponents in the same file; move shared/complex ones to their own files under `ui/`.  
- Avoid giant Tailwind strings; extract repeated class sets into `clsx`/`cva` helpers or small wrapper components.

## Testing guidance
- **Use-cases**: unit test domain rules with in-memory/mocked ports; cover error cases.  
- **Adapters**: contract test against fixtures; ensure mapping handles API quirks.  
- **Hooks/Components**: render with test adapters; assert UI state transitions and rendering only.  
- Avoid deep integration tests that jump across domains; prefer seams.

## PR review prompts
- Does each file own one reason to change? (SRP)  
- Can adapters be swapped without changing UI? (DIP/LSP)  
- Are port interfaces small and focused? (ISP)  
- Are domain terms consistent across types, errors, and UI copy?  
- Are domain rules kept out of JSX and adapter wiring?
