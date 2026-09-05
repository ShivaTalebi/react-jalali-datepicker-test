import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  JalaliDatepicker,
  formatCalendarDate,
  parseCalendarDate,
  parseJalaliDate,
  type CalendarSystem,
  type IslamicDateAdjustment,
  type JalaliDisplayFormat,
  type JalaliDisabledDateRange,
} from "flexible-persian-datepicker";

type TargetKind = "input" | "span";

type PickerExampleProps = {
  title: string;
  description: string;
  target: TargetKind;
  format: JalaliDisplayFormat;
  showActionButtons: boolean;
  label?: ReactNode;
  initialValue?: Date | null;
  disabledDateRanges?: readonly JalaliDisabledDateRange[];
  calendar?: CalendarSystem;
  islamicDateAdjustment?: IslamicDateAdjustment;
};

const formats: JalaliDisplayFormat[] = [
  "YYYY-MM-DD",
  "YYYY/MM/DD",
  "DD/MM/YYYY",
  "DD MMM YYYY",
  "MMMM DD, YYYY",
  "dddd DD MMMM YYYY",
  "dddd, DD MMMM YYYY",
];

const defaultDate = new Date(2026, 7, 15);
const sampleDisabledRanges: JalaliDisabledDateRange[] = [
  {
    from: parseJalaliDate("1405/05/26", "YYYY/MM/DD", "fa")!,
    to: parseJalaliDate("1405/06/03", "YYYY/MM/DD", "fa")!,
  },
];

function PickerExample({
  title,
  description,
  target,
  format,
  showActionButtons,
  label,
  initialValue = null,
  disabledDateRanges = [],
  calendar = "jalali",
  islamicDateAdjustment,
}: PickerExampleProps) {
  const formatDate = useCallback(
    (date: Date | null) =>
      formatCalendarDate(date, format, {
        calendar,
        locale: "fa",
        islamicDateAdjustment,
      }),
    [calendar, format, islamicDateAdjustment]
  );
  const parseDate = useCallback(
    (text: string) =>
      parseCalendarDate(text, format, {
        calendar,
        locale: "fa",
        islamicDateAdjustment,
      }),
    [calendar, format, islamicDateAdjustment]
  );
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Date | null>(initialValue);
  const [pickerValue, setPickerValue] = useState<Date | null | undefined>(
    initialValue ?? undefined
  );
  const [inputText, setInputText] = useState(() =>
    initialValue ? formatDate(initialValue) : ""
  );
  const inputTextRef = useRef(
    initialValue ? formatDate(initialValue) : ""
  );
  const committedValueRef = useRef<Date | null>(initialValue);
  const confirmedCloseRef = useRef(false);
  const incompleteTypingRef = useRef(false);
  const [inputError, setInputError] = useState(false);
  const anchorRef = useRef<HTMLInputElement | HTMLSpanElement | null>(null);

  const displayedValue = value
    ? formatDate(value)
    : "";

  const openPicker = () => {
    confirmedCloseRef.current = false;
    setOpen(true);
  };
  const acceptDate = (date: Date | null) => {
    const nextText = date ? formatDate(date) : "";
    committedValueRef.current = date;
    incompleteTypingRef.current = false;
    inputTextRef.current = nextText;
    setValue(date);
    setPickerValue(date);
    setInputText(nextText);
    setInputError(false);
  };
  const commitTypedDate = () => {
    if (!inputText.trim()) {
      setPickerValue(null);
      setInputError(false);
      return false;
    }
    const parsed = parseDate(inputText);
    if (!parsed) {
      setInputError(true);
      return false;
    }
    acceptDate(parsed);
    return true;
  };
  const handleTypedDateChange = (text: string) => {
    inputTextRef.current = text;
    setInputText(text);
    setInputError(false);

    const parsed = parseDate(text);
    incompleteTypingRef.current = text.trim() !== "" && !parsed;
    setPickerValue(parsed);
    if (parsed) {
      // Live controlled sync: year, month and selected day immediately
      // update inside an already-open calendar without normalizing user input.
      committedValueRef.current = parsed;
      setValue(parsed);
    }
  };
  const closePicker = () => {
    if (confirmedCloseRef.current) {
      confirmedCloseRef.current = false;
      setOpen(false);
      return;
    }
    const currentText = inputTextRef.current;
    const typedDate = currentText.trim()
      ? parseDate(currentText)
      : null;
    if (!typedDate) {
      const committed = committedValueRef.current;
      const restoredText = committed
        ? formatDate(committed)
        : "";
      inputTextRef.current = restoredText;
      setPickerValue(committed);
      setInputText(restoredText);
      setInputError(false);
    }
    setOpen(false);
  };
  const confirmDate = (date: Date | null) => {
    const confirmed = date ?? (!incompleteTypingRef.current ? new Date() : null);
    confirmedCloseRef.current = true;
    acceptDate(confirmed);
  };
  useEffect(() => {
    if (open) return;
    const currentText = inputTextRef.current;
    const parsed = currentText.trim()
      ? parseDate(currentText)
      : null;
    if (parsed) return;

    const committed = committedValueRef.current;
    const restoredText = committed
      ? formatDate(committed)
      : "";
    inputTextRef.current = restoredText;
    setPickerValue(committed);
    setInputText(restoredText);
    setInputError(false);
  }, [open, formatDate, parseDate]);
  const handleSpanKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <article className="example-card">
      <div className="example-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <code>{format}</code>
      </div>

      <div className="target-row">
        {target === "input" ? (
          <input
            ref={anchorRef as RefObject<HTMLInputElement>}
            className="date-target date-input"
            value={inputText}
            placeholder={format}
            onClick={openPicker}
            onFocus={openPicker}
            onChange={(event) => handleTypedDateChange(event.target.value)}
            onBlur={commitTypedDate}
            onKeyDown={(event) => {
              if (event.key === "Enter" && commitTypedDate()) {
                setOpen(false);
                event.currentTarget.blur();
              }
            }}
            aria-invalid={inputError || undefined}
            aria-label={title}
          />
        ) : (
          <span
            ref={anchorRef as RefObject<HTMLSpanElement>}
            className="date-target date-span"
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={handleSpanKeyDown}
            aria-label={title}
          >
            {displayedValue || "انتخاب تاریخ"}
          </span>
        )}

        <button
          type="button"
          className="clear-button"
          onClick={() => acceptDate(null)}
          disabled={!value}
        >
          پاک‌کردن
        </button>
      </div>

      {target === "input" && inputError && (
        <p className="input-error">تاریخ با فرمت {format} معتبر نیست.</p>
      )}

      <div className="mode-badge">
        {showActionButtons
          ? "حالت تأیید و انصراف"
          : "حالت انتخاب فوری"}
      </div>

      <JalaliDatepicker
        open={open}
        anchorRef={anchorRef}
        value={pickerValue}
        label={label}
        locale="fa"
        calendar={calendar}
        islamicDateAdjustment={islamicDateAdjustment}
        showActionButtons={showActionButtons}
        disabledDateRanges={disabledDateRanges}
        onConfirm={confirmDate}
        onClose={closePicker}
      />
    </article>
  );
}

export default function App() {
  return (
    <main className="playground" dir="rtl">
      <header className="page-header">
        <span className="eyebrow">flexible-persian-datepicker</span>
        <h1>آزمایش کامل تقویم چندگانه</h1>
        <p>
          تقویم‌های شمسی، قمری و میلادی، تمام targetها، فرمت‌های خروجی و
          حالت‌های رفتاری کتابخانه در این صفحه مستقل از یکدیگر قابل آزمایش‌اند.
        </p>
      </header>

      <section className="demo-section">
        <div className="section-heading">
          <h2>نمونه‌های Input</h2>
          <p>مقدار پیش‌فرض، تأیید و انصراف، و انتخاب فوری</p>
        </div>

        <div className="examples-grid input-grid">
          <PickerExample
            title="Input با تاریخ پیش‌فرض"
            description="دارای مقدار اولیه و دکمه‌های تأیید و انصراف"
            target="input"
            format="YYYY/MM/DD"
            showActionButtons={true}
            label="تاریخ شروع قرارداد"
            initialValue={defaultDate}
          />

          <PickerExample
            title="Input با انتخاب فوری"
            description="بدون دکمه؛ انتخاب روز بلافاصله ثبت می‌شود"
            target="input"
            format="DD/MM/YYYY"
            showActionButtons={false}
          />

          <PickerExample
            title="Input با بازه غیرفعال"
            description="بازه ۲۶ مرداد تا ۳ شهریور ۱۴۰۵ غیرقابل انتخاب است"
            target="input"
            format="YYYY/MM/DD"
            showActionButtons={true}
            label="بازه قابل رزرو"
            initialValue={defaultDate}
            disabledDateRanges={sampleDisabledRanges}
          />
        </div>
      </section>

      <section className="demo-section">
        <div className="section-heading">
          <h2>تقویم‌های شمسی، قمری و میلادی</h2>
          <p>هر سه حالت از یک مقدار استاندارد JavaScript Date استفاده می‌کنند.</p>
        </div>

        <div className="examples-grid input-grid">
          <PickerExample
            title="تقویم هجری شمسی"
            description="نمایش جلالی با سازگاری کامل نسخه‌های قبلی"
            target="input"
            format="YYYY/MM/DD"
            calendar="jalali"
            showActionButtons
            initialValue={defaultDate}
          />
          <PickerExample
            title="تقویم هجری قمری عددی"
            description="نمایش عددی قمری با اصلاح پیش‌فرض اختلاف یک‌روزه"
            target="input"
            format="YYYY/MM/DD"
            calendar="islamic"
            showActionButtons={false}
            initialValue={defaultDate}
          />
          <PickerExample
            title="تقویم هجری قمری نوشتاری"
            description="نمایش تاریخ همراه با نام ماه قمری"
            target="input"
            format="DD MMM YYYY"
            calendar="islamic"
            showActionButtons
            initialValue={defaultDate}
          />
          <PickerExample
            title="تقویم میلادی عددی"
            description="نمایش عددی با ارقام لاتین و رابط انگلیسی"
            target="input"
            format="YYYY-MM-DD"
            calendar="gregorian"
            showActionButtons={false}
            initialValue={defaultDate}
          />
          <PickerExample
            title="تقویم میلادی نوشتاری"
            description="نام ماه و روز، Dropdownها و دکمه‌ها کاملاً انگلیسی هستند"
            target="input"
            format="dddd, DD MMMM YYYY"
            calendar="gregorian"
            showActionButtons
            initialValue={defaultDate}
          />
        </div>
      </section>

      <section className="demo-section">
        <div className="section-heading">
          <h2>تمام فرمت‌ها روی Span</h2>
          <p>برای بازشدن تقویم روی هر Span کلیک کنید.</p>
        </div>

        <div className="examples-grid span-grid">
          {formats.map((format, index) => (
            <PickerExample
              key={format}
              title={`Span شماره ${index + 1}`}
              description={`خروجی با فرمت ${format}`}
              target="span"
              format={format}
              showActionButtons={index % 2 === 0}
              label={
                index % 3 === 0
                  ? `تاریخ نمونه ${index + 1}`
                  : index % 3 === 1
                    ? undefined
                    : "زمان انتخاب‌شده"
              }
            />
          ))}
        </div>
      </section>
    </main>
  );
}
