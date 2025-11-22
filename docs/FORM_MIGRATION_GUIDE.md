# Form Migration Guide: React Hook Form + Zod + Radix UI

## ✅ Completed Migrations (Phase 1)

### 1. FeeStructureForm ✅
- **Before:** 238 lines with manual useState
- **After:** 339 lines with React Hook Form + Zod + Radix UI Dialog
- **Benefits:**
  - Type-safe validation with Zod
  - Automatic error handling
  - Professional modal with accessibility
  - Dynamic total fee calculation with `watch()`
  - Better UX (escape key, click outside to close)

### 2. PaymentForm ✅
- **Before:** 272 lines with manual validation
- **After:** 386 lines with React Hook Form + Zod + Radix UI Dialog
- **Benefits:**
  - Complex conditional validation (transaction_id required for non-cash)
  - Custom validation (amount <= pending amount)
  - Real-time field watching
  - Better error messages
  - Professional modal UI

## 📋 Pattern Established

All migrations follow this standard pattern:

### Step 1: Create Zod Schema

```typescript
import { z } from 'zod';

const formSchema = z.object({
  field_name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  amount: z.number().positive().multipleOf(0.01),
  // ... more fields
}).refine(
  (data) => {
    // Custom validation logic
    return condition;
  },
  {
    message: 'Error message',
    path: ['field_name'],
  }
);

type FormData = z.infer<typeof formSchema>;
```

### Step 2: useForm Hook

```typescript
const {
  register,
  handleSubmit,
  watch,
  formState: { errors, isSubmitting },
  setError,
} = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    // ... initial values
  },
});
```

### Step 3: Radix UI Dialog Wrapper

```typescript
return (
  <Dialog.Root open={isOpen} onOpenChange={onClose}>
    <Dialog.Portal>
      <Dialog.Overlay style={{ /* backdrop styles */ }} />
      <Dialog.Content style={{ /* modal styles */ }}>
        <Dialog.Title>{title}</Dialog.Title>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Form fields */}
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
```

### Step 4: Form Fields

```typescript
<FormInput
  label="Field Label"
  {...register('field_name', { valueAsNumber: true })} // for numbers
  error={errors.field_name?.message}
  helperText="Helper text"
  required
/>
```

## 🚀 Quick Migration Checklist

For any form:

- [ ] Install libraries (already done: react-hook-form, zod, @radix-ui/react-dialog)
- [ ] Create Zod schema with all validations
- [ ] Replace useState with useForm hook
- [ ] Replace manual modal with Radix Dialog
- [ ] Connect FormInput components with `{...register()}`
- [ ] Use `errors.field?.message` for validation messages
- [ ] Use `watch()` for field dependencies
- [ ] Update parent component to pass `isOpen` prop
- [ ] Test all validation scenarios

## 📚 Remaining Forms to Migrate

### GuardianForm (Medium Priority)
**Current:** Manual state management
**Fields:** name, phone, email, address, relationship
**Complexity:** Low - straightforward validation

**Zod Schema Preview:**
```typescript
const guardianSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone'),
  email: z.string().email().optional(),
  address: z.string().optional(),
  relationship: z.enum(['father', 'mother', 'guardian']),
});
```

### ConcessionForm (Medium Priority)
**Current:** Manual state management
**Fields:** student_id, concession_type, amount/percentage, reason, dates
**Complexity:** Medium - conditional validation (amount OR percentage)

**Zod Schema Preview:**
```typescript
const concessionSchema = z.object({
  student_id: z.number().int().positive(),
  concession_type: z.enum(['scholarship', 'sibling', 'staff', 'merit', 'financial']),
  concession_amount: z.number().min(0).optional(),
  concession_percentage: z.number().min(0).max(100).optional(),
  reason: z.string().min(10),
  valid_from: z.string(),
  valid_to: z.string(),
}).refine(
  (data) => data.concession_amount || data.concession_percentage,
  { message: 'Either amount or percentage is required' }
);
```

### StudentFormEnhanced (High Priority - Largest)
**Current:** 820 lines with manual state for 40+ fields
**Complexity:** High - nested sections, conditional fields, multiple validations

**Strategy:**
1. Split into sections (Basic, Guardian, Government, Performance, etc.)
2. Create separate Zod schemas per section
3. Compose schemas with `z.merge()` or nested objects
4. Use collapsible sections in UI
5. Consider multi-step form if too complex

**Zod Schema Preview:**
```typescript
const basicInfoSchema = z.object({
  admission_number: z.string().min(1).max(20),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  date_of_birth: z.string(),
  gender: z.enum(['Male', 'Female', 'Other']),
  class_id: z.number().int().positive(),
});

const guardianSchema = z.object({
  parent_name: z.string().min(1),
  parent_phone: z.string().regex(/^[6-9]\d{9}$/),
  parent_email: z.string().email().optional(),
  address: z.string().optional(),
});

const studentSchema = basicInfoSchema.merge(guardianSchema).extend({
  // Add more fields
  aadhaar_number: z.string().length(12).optional(),
  has_hostel: z.boolean().default(false),
  transport_route_id: z.number().optional(),
});
```

## 💡 Advanced Patterns

### Conditional Field Requirements

```typescript
.refine(
  (data) => {
    if (data.payment_mode !== 'cash') {
      return !!data.transaction_id;
    }
    return true;
  },
  {
    message: 'Transaction ID required for non-cash payments',
    path: ['transaction_id'],
  }
)
```

### Cross-Field Validation

```typescript
.refine(
  (data) => data.amount <= maxAmount,
  {
    message: `Cannot exceed ${maxAmount}`,
    path: ['amount'],
  }
)
```

### Dynamic Field Watching

```typescript
const paymentMode = watch('payment_mode');
const hasHostel = watch('has_hostel');

// Use in render
<FormInput
  required={paymentMode !== 'cash'}
  placeholder={hasHostel ? 'Hostel room number' : 'N/A'}
/>
```

### Form Reset After Success

```typescript
const { reset } = useForm();

const onSubmit = async (data) => {
  await apiClient.create(data);
  reset(); // Clear form
  onClose();
};
```

## 🎯 Benefits Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Manual validation code** | ~50 lines per form | 0 lines | 100% reduction |
| **Type safety** | Partial | Complete | ✅ Full inference |
| **Error handling** | Manual state | Automatic | ✅ Built-in |
| **Accessibility** | Limited | Full | ✅ ARIA compliant |
| **Code reusability** | Low | High | ✅ Zod schemas reusable |
| **Developer experience** | Manual wiring | Declarative | ✅ Much better |

## 📝 Testing Checklist

After migration, test:

- [x] Form opens/closes properly
- [x] All validation rules work
- [x] Error messages display correctly
- [x] Submit button disabled during submission
- [x] Success callback triggers
- [x] Form resets after success
- [x] Keyboard navigation (Tab, Enter, Escape)
- [x] Click outside to close
- [x] Required fields show asterisk
- [x] Helper text displays
- [x] Number fields parse correctly (valueAsNumber)

## 🔗 Resources

- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Docs](https://zod.dev/)
- [Radix UI Dialog Docs](https://www.radix-ui.com/docs/primitives/components/dialog)
- [Our CLAUDE.md](/CLAUDE.md) - Project conventions

## 📅 Migration Timeline

**Phase 1 (Completed):** FeeStructureForm, PaymentForm
**Phase 2 (Next):** GuardianForm, ConcessionForm
**Phase 3 (Final):** StudentFormEnhanced

**Estimated Time:**
- GuardianForm: 1 hour
- ConcessionForm: 1.5 hours
- StudentFormEnhanced: 3-4 hours

**Total:** ~6 hours for complete migration

## 💪 Why This Matters

1. **Robustness:** Battle-tested libraries handle edge cases
2. **Maintainability:** Less custom code to maintain
3. **Consistency:** Same pattern across all forms
4. **DX:** Better developer experience with TypeScript
5. **UX:** Better user experience with proper accessibility
6. **Future-proof:** Easy to add new validations

---

**Status:** 2/5 forms migrated (40% complete)
**Next:** Migrate GuardianForm using established pattern
