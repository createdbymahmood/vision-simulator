---
name: react-frontend-skill
description: tells how to do react development in the app
license: Complete terms in LICENSE.txt
---

## Core Principles

### Package Management

- **Always use Yarn**: `yarn add`, `yarn install`, `yarn run` — never introduce npm/pnpm lockfiles
- Keep `yarn.lock` committed and up-to-date

### Component Structure

- **Size limit**: ~150–200 lines per component maximum
- **Split when bulky**: extract subcomponents (inline for local-only, separate files for reusable)
- **No giant files**: 400+ line components are refactoring candidates

### Import Conventions

```typescript
// ✅ Absolute paths (configured in tsconfig)
import {Button} from '@/components/ui/button'
import {useAuth} from '@/features/auth/hooks/use-auth'
import {UserRepository} from '@/features/user/infrastructure/user-repository'

// ❌ Avoid relative paths for cross-feature imports
import {Button} from '../../../components/ui/button'
```

### Component Declaration

```typescript
// ✅ Always use this pattern with named interfaces
interface UserProfileProps {
  userId: string;
  onUpdate: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  return <div>Profile</div>;
};

// ❌ Never use inline prop types
export const UserProfile: React.FC<{
  userId: string;
  onUpdate: (user: User) => void;
}> = ({ userId, onUpdate }) => {
  return <div>Profile</div>;
};

// ❌ Never use default exports or function declarations
export default function UserProfile() { }
function UserProfile() { }
export default UserProfile;
```

### Callback Conventions

```typescript
// ✅ Event callbacks: onX pattern
interface FormComponentProps {
  onSubmit: (data: FormData) => void
  onCancel: () => void
  onValidate: (field: string) => boolean
}

export const FormComponent: React.FC<FormComponentProps> = ({
  onSubmit,
  onCancel,
  onValidate,
}) => {
  // ...
}

// ❌ Avoid handleX in props
interface FormComponentProps {
  handleSubmit: () => void // Wrong
}
```

### Stable Callbacks

```typescript
import { useCallbackRef } from '@radix-ui/react-use-callback-ref';

// ✅ Use useCallbackRef for stable references
export const Component: React.FC = () => {
  const onSubmit = useCallbackRef((data: FormData) => {
    // Stable callback, won't cause re-renders
  });

  return <Form onSubmit={onSubmit} />;
};

// ❌ Avoid React.useCallback
const onSubmit = React.useCallback(() => { }, []);
```

---

## DDD Architecture

### Layer Structure

```
src/
├── features/
│   ├── user/
│   │   ├── domain/
│   │   │   ├── user.entity.ts
│   │   │   ├── user.repository.port.ts
│   │   │   └── user.value-objects.ts
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   │   ├── create-user.use-case.ts
│   │   │   │   └── update-user.use-case.ts
│   │   │   └── ports/
│   │   │       └── notification.port.ts
│   │   ├── infrastructure/
│   │   │   ├── adapters/
│   │   │   │   ├── http-user.repository.ts
│   │   │   │   └── toast-notification.adapter.ts
│   │   │   └── stores/
│   │   │       └── user.store.ts
│   │   └── presentation/
│   │       ├── components/
│   │       │   ├── user-form.tsx
│   │       │   └── user-list.tsx
│   │       └── hooks/
│   │           └── use-create-user.tsx
│   └── auth/
│       └── ... (same structure)
└── shared/
    ├── ui/
    │   ├── button.tsx
    │   └── input.tsx
    └── utils/
```

### Domain Layer (Entities & Ports)

```typescript
// features/user/domain/user.entity.ts
export type UserId = string & {readonly __brand: 'UserId'}

export interface User {
  readonly id: UserId
  readonly email: string
  readonly name: string
  readonly createdAt: Date
}

export const createUser = (props: Omit<User, 'id' | 'createdAt'>): User => ({
  id: crypto.randomUUID() as UserId,
  email: props.email,
  name: props.name,
  createdAt: new Date(),
})

// features/user/domain/user.repository.port.ts
export interface UserRepository {
  findById: (id: UserId) => Promise<User | null>
  findAll: () => Promise<User[]>
  save: (user: User) => Promise<User>
  delete: (id: UserId) => Promise<void>
}
```

### Application Layer (Use Cases)

```typescript
// features/user/application/use-cases/create-user.use-case.ts
import {createUser, User} from '@/features/user/domain/user.entity'
import {UserRepository} from '@/features/user/domain/user.repository.port'
import {NotificationPort} from '@/features/user/application/ports/notification.port'

export interface CreateUserInput {
  email: string
  name: string
}

export interface CreateUserUseCase {
  execute: (input: CreateUserInput) => Promise<User>
}

export const createCreateUserUseCase = (
  userRepository: UserRepository,
  notification: NotificationPort,
): CreateUserUseCase => ({
  execute: async (input) => {
    const user = createUser(input)
    const saved = await userRepository.save(user)
    notification.success('User created successfully')
    return saved
  },
})
```

### Infrastructure Layer (Adapters)

```typescript
// features/user/infrastructure/adapters/http-user.repository.ts
import {UserRepository} from '@/features/user/domain/user.repository.port'
import {User, UserId} from '@/features/user/domain/user.entity'

export const createHttpUserRepository = (baseUrl: string): UserRepository => ({
  findById: async (id) => {
    const res = await fetch(`${baseUrl}/users/${id}`)
    if (!res.ok) return null
    return res.json()
  },

  findAll: async () => {
    const res = await fetch(`${baseUrl}/users`)
    return res.json()
  },

  save: async (user) => {
    const res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(user),
    })
    return res.json()
  },

  delete: async (id) => {
    await fetch(`${baseUrl}/users/${id}`, {method: 'DELETE'})
  },
})

// features/user/infrastructure/adapters/toast-notification.adapter.ts
import {toast} from 'sonner'
import {NotificationPort} from '@/features/user/application/ports/notification.port'

export const createToastNotificationAdapter = (): NotificationPort => ({
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  info: (message) => toast.info(message),
})
```

### Zustand Store Example (Context-backed)

```typescript
import {produce} from 'immer'
import {find, findIndex, remove} from 'lodash-es'
import type {StateCreator, StoreApi} from 'zustand'
import {createZustandContextStore} from '@components/shared/zustand.tsx'

// 1. Define State Interface
export interface DashboardWidgetsBoardState {
  views: DashboardView[]
  isFullScreen: boolean

  // Actions (inline, not separate functions)
  setWidgets: (viewId: string, widgets: Widget[]) => DashboardView[]
  updateWidget: (
    viewId: string,
    widgetId: string,
    widget: Widget,
  ) => DashboardView[]
  deleteWidget: (viewId: string, widgetIds: string[]) => DashboardView[]
  addView: (view: Omit<DashboardView, 'widgets'>) => DashboardView[]
  deleteView: (viewId: string) => DashboardView[]
  toggleFullScreen: (nextValue?: boolean) => boolean
}

type SetState = StoreApi<DashboardWidgetsBoardState>['setState']
type GetState = StoreApi<DashboardWidgetsBoardState>['getState']

// 2. Define Action Handlers (pure functions)
const setWidgets = (
  set: SetState,
  get: GetState,
  viewId: string,
  widgets: Widget[],
) => {
  const nextValue = produce((state: DashboardWidgetsBoardState) => {
    const view = find(state.views, {id: viewId})
    if (view) {
      view.widgets = widgets
    }
  })

  set(nextValue)
  return get().views
}

const deleteWidget = (
  set: SetState,
  get: GetState,
  viewId: string,
  widgetIds: string[],
) => {
  const nextValue = produce((state: DashboardWidgetsBoardState) => {
    const view = find(state.views, {id: viewId})
    if (!view) return

    remove(view.widgets, (w) => widgetIds.includes(w.id))
  })

  set(nextValue)
  return get().views
}

const addView = (
  set: SetState,
  get: GetState,
  view: Omit<DashboardView, 'widgets'>,
) => {
  const newView: DashboardView = {
    ...view,
    widgets: [],
  }

  const nextValue = produce((state: DashboardWidgetsBoardState) => {
    state.views.push(newView)
  })

  set(nextValue)
  return get().views
}

const toggleFullScreen = (
  set: SetState,
  get: GetState,
  nextValue?: boolean,
) => {
  const nextUpdater = produce((state: DashboardWidgetsBoardState) => {
    state.isFullScreen =
      typeof nextValue === 'boolean' ? nextValue : !state.isFullScreen
  })

  set(nextUpdater)
  return get().isFullScreen
}

// 3. Create Store Factory
const createDashboardWidgetsBoardStore =
  (
    initialValues: Partial<DashboardWidgetsBoardState>,
  ): StateCreator<DashboardWidgetsBoardState> =>
  (set, get) => ({
    // Default values
    views: [],
    isFullScreen: false,

    // Bind actions
    setWidgets: (viewId, widgets) => setWidgets(set, get, viewId, widgets),
    updateWidget: (viewId, widgetId, widget) =>
      updateWidget(set, get, viewId, widgetId, widget),
    deleteWidget: (viewId, widgetIds) =>
      deleteWidget(set, get, viewId, widgetIds),
    addView: (view) => addView(set, get, view),
    deleteView: (viewId) => deleteView(set, get, viewId),
    toggleFullScreen: (nextValue) => toggleFullScreen(set, get, nextValue),

    // Override with initial values
    ...initialValues,
  })

// 4. Create Context Store
export const {
  Provider: DashboardWidgetsBoardStoreProvider,
  useStore: useDashboardWidgetsBoardStore,
} = createZustandContextStore<
  DashboardWidgetsBoardState,
  Partial<DashboardWidgetsBoardState>
>(createDashboardWidgetsBoardStore)
```

### Presentation Layer (Hooks + Components)

```typescript
// features/user/presentation/hooks/use-create-user.tsx
import { useState } from 'react';
import { useCallbackRef } from '@radix-ui/react-use-callback-ref';
import { CreateUserInput, CreateUserUseCase } from '@/features/user/application/use-cases/create-user.use-case';
import { User } from '@/features/user/domain/user.entity';

export const useCreateUser = (useCase: CreateUserUseCase) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallbackRef(async (input: CreateUserInput): Promise<User | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await useCase.execute(input);
      return user;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  });

  return { execute, isLoading, error };
};

// features/user/presentation/components/user-form.tsx
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateUserInput } from '@/features/user/application/use-cases/create-user.use-case';

interface UserFormProps {
  onSubmit: (data: CreateUserInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ onSubmit, onCancel, isLoading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserInput>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 border rounded-lg">
      <Input
        {...register('name', { required: 'Name is required' })}
        placeholder="Name"
        error={errors.name?.message}
      />

      <Input
        {...register('email', { required: 'Email is required' })}
        placeholder="Email"
        type="email"
        error={errors.email?.message}
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create User'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
```

---

## SOLID Principles (Functional Style)

### Single Responsibility Principle

```typescript
// ✅ Each file/function has one reason to change
// user.validator.ts
export const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// user.formatter.ts
export const formatUserName = (name: string): string =>
  name.trim().toUpperCase()

// ❌ Mixed responsibilities
export const userHelpers = {
  validate: (email: string) => {},
  format: (name: string) => {},
  sendEmail: (to: string) => {}, // Different concern!
}
```

### Open/Closed Principle

```typescript
// ✅ Extend via composition, not modification
export interface PaymentGateway {
  processPayment: (amount: number) => Promise<void>
}

export const createStripeGateway = (): PaymentGateway => ({
  processPayment: async (amount) => {
    /* Stripe logic */
  },
})

export const createPayPalGateway = (): PaymentGateway => ({
  processPayment: async (amount) => {
    /* PayPal logic */
  },
})

// UI depends on interface, not concrete implementation
interface CheckoutFormProps {
  gateway: PaymentGateway
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({gateway}) => {
  // ...
}

// ❌ Switch-on-type cascade
const processPayment = (type: 'stripe' | 'paypal', amount: number) => {
  if (type === 'stripe') {
    /* ... */
  } else if (type === 'paypal') {
    /* ... */
  }
  // Adding new gateway requires modifying this function
}
```

### Liskov Substitution Principle

```typescript
// ✅ All implementations are substitutable
export interface DataSource<T> {
  fetch: () => Promise<T[]>
}

export const createApiDataSource = <T>(url: string): DataSource<T> => ({
  fetch: async () => {
    const res = await fetch(url)
    return res.json()
  },
})

export const createMockDataSource = <T>(data: T[]): DataSource<T> => ({
  fetch: async () => data,
})

// Component works with any DataSource implementation
interface DataListProps {
  source: DataSource<User>
}

export const DataList: React.FC<DataListProps> = ({source}) => {
  // Works identically regardless of which source is passed
}
```

### Interface Segregation Principle

```typescript
// ✅ Small, focused interfaces
export interface Readable {
  read: () => Promise<string>
}

export interface Writable {
  write: (data: string) => Promise<void>
}

export interface Deletable {
  delete: () => Promise<void>
}

// Clients depend only on what they need
interface LogViewerProps {
  source: Readable
}

export const LogViewer: React.FC<LogViewerProps> = ({source}) => {}

// ❌ Fat interface forces unnecessary dependencies
export interface FileSystem {
  read: () => Promise<string>
  write: (data: string) => Promise<void>
  delete: () => Promise<void>
  chmod: (permissions: number) => Promise<void>
  // LogViewer only needs read, but must accept entire interface
}
```

### Dependency Inversion Principle

```typescript
// ✅ High-level modules depend on abstractions
// Application layer defines the port
export interface EmailService {
  send: (to: string, body: string) => Promise<void>
}

// Use case depends on abstraction
export const createSendWelcomeEmailUseCase = (emailService: EmailService) => ({
  execute: async (email: string) => {
    await emailService.send(email, 'Welcome!')
  },
})

// Infrastructure provides concrete implementation
export const createSendGridEmailService = (apiKey: string): EmailService => ({
  send: async (to, body) => {
    /* SendGrid API call */
  },
})

// Composition root wires everything together
const emailService = createSendGridEmailService(process.env.SENDGRID_KEY)
const sendWelcomeEmail = createSendWelcomeEmailUseCase(emailService)

// ❌ Direct dependency on concrete implementation
import {sendEmail} from './sendgrid-client' // Tightly coupled
export const sendWelcomeEmail = (email: string) => {
  sendEmail(email, 'Welcome!') // Can't substitute implementation
}
```

---

## Utility Preferences

### Lodash from @lodash-es

```typescript
// ✅ Always use lodash-es
import {debounce, groupBy, uniqBy} from 'lodash-es'

export const useDebounced = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = debounce(() => setDebouncedValue(value), delay)
    handler()
    return handler.cancel
  }, [value, delay])

  return debouncedValue
}

// ❌ Don't reinvent lodash utilities
const debounce = (fn: Function, delay: number) => {
  /* custom impl */
}
```

---

## Checklist

- [ ] Using Yarn exclusively (no npm/pnpm lockfiles)
- [ ] All components declared as `export const X: React.FC<XProps>` with named interface
- [ ] Never use inline prop types `React.FC<{ prop: string }>`
- [ ] Absolute imports configured (`@/` prefix)
- [ ] Event callbacks named `onX` (not `handleX`)
- [ ] Using `useCallbackRef` instead of `useCallback`
- [ ] Zustand stores context-backed with `immer` middleware
- [ ] Components under ~150-200 lines (split when larger)
- [ ] Lodash utilities from `lodash-es`
- [ ] Clear domain/application/infrastructure/presentation layers
- [ ] Ports defined in domain/application
- [ ] Adapters implement ports in infrastructure
- [ ] Use cases depend on ports, not adapters
- [ ] UI depends on use cases and hooks, not adapters directly

---

## Example Project Structure

```
my-app/
├── src/
│   ├── features/
│   │   ├── user/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── auth/
│   ├── shared/
│   │   ├── ui/
│   │   ├── hooks/
│   │   └── utils/
│   ├── app.tsx
│   └── main.tsx
├── package.json (with yarn.lock)
└── tsconfig.json (with @/ paths)
```
