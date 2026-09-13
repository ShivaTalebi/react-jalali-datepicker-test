import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import {
  JalaliDatepicker,
  formatJalaliDate,
  parseJalaliDate,
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
  label?: string | null;
  initialValue?: Date | null;
  disabledDateRanges?: readonly JalaliDisabledDateRange[];
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
}: PickerExampleProps) {
  const formatDate = useCallback(
    (date: Date | null) => formatJalaliDate(date, format, "fa"),
    [format]
  );
  const parseDate = useCallback(
    (text: string) => parseJalaliDate(text, format, "fa"),
    [format]
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
        showActionButtons={showActionButtons}
        disabledDateRanges={disabledDateRanges}
        onConfirm={confirmDate}
        onClose={closePicker}
      />
    </article>
  );
}

function InputGroupExample() {
  const format: JalaliDisplayFormat = "YYYY/MM/DD";
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Date | null>(defaultDate);
  const groupRef = useRef<HTMLDivElement | null>(null);

  return (
    <article className="example-card">
      <div className="example-heading">
        <div>
          <h2>Input Group با آیکن تقویم</h2>
          <p>تقویم به کل گروه متصل است و با input یا دکمه باز می‌شود.</p>
        </div>
        <code>{format}</code>
      </div>
      <div ref={groupRef} className="calendar-input-group">
        <input
          className="calendar-group-input"
          value={formatJalaliDate(value, format, "fa")}
          readOnly
          onClick={() => setOpen(true)}
          aria-label="تاریخ در Input Group"
        />
        <button
          type="button"
          className="calendar-icon-button"
          onClick={() => setOpen(true)}
          aria-label="بازکردن تقویم"
        >
          <span aria-hidden="true">▦</span>
        </button>
      </div>
      <JalaliDatepicker
        open={open}
        anchorRef={groupRef}
        value={value}
        label="تاریخ تحویل"
        showActionButtons
        onConfirm={setValue}
        onClose={() => setOpen(false)}
      />
    </article>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"inputs" | "formats" | "other">("inputs");
  const tabs = [
    { id: "inputs" as const, label: "نمونه‌های Input" },
    { id: "formats" as const, label: "فرمت‌های نمایش" },
    { id: "other" as const, label: "سایر مثال‌ها" },
  ];

  return (
    <main className="playground" dir="rtl">
      <header className="page-header">
        <span className="eyebrow">flexible-persian-datepicker</span>
        <h1>دموی کامل تقویم فارسی</h1>
        <p>
          تمام حالت‌های ورودی، فرمت‌های خروجی، هدر و فوتر اختیاری و رفتار
          responsive تقویم را در تب‌های زیر آزمایش کنید.
        </p>
      </header>

      <nav className="calendar-tabs" aria-label="انتخاب گروه مثال" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "calendar-tab is-active" : "calendar-tab"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "inputs" && <section className="demo-section" role="tabpanel">
        <div className="section-heading">
          <h2>نمونه‌های Input</h2>
          <p>مقدار پیش‌فرض، برچسب سفارشی، فوتر اختیاری و انتخاب فوری</p>
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
      </section>}

      {activeTab === "formats" && <section className="demo-section" role="tabpanel">
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
      </section>}

      {activeTab === "other" && <section className="demo-section" role="tabpanel">
        <div className="section-heading">
          <h2>سایر مثال‌ها</h2>
          <p>استفاده روی عناصر سفارشی و گروه ورودی مشابه Bootstrap و Tailwind</p>
        </div>
        <div className="examples-grid input-grid">
          <InputGroupExample />
          <PickerExample
            title="Span بدون برچسب و فوتر"
            description="با انتخاب روز، مقدار همان لحظه ثبت می‌شود."
            target="span"
            format="dddd DD MMMM YYYY"
            showActionButtons={false}
            label={null}
            initialValue={defaultDate}
          />
        </div>
      </section>}
    </main>
  );
}
