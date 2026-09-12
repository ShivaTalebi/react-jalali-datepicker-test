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
  formatCalendarDate,
  formatJalaliDate,
  parseCalendarDate,
  parseJalaliDate,
  type CalendarDisplayFormat,
  type CalendarSystem,
  type JalaliDisplayFormat,
  type JalaliDisabledDateRange,
} from "flexible-multi-calendar-datepicker";

type TargetKind = "input" | "span";

type PickerExampleProps = {
  title: string;
  description: string;
  target: TargetKind;
  format: JalaliDisplayFormat;
  showActionButtons: boolean;
  label?: string;
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

type CalendarSystemExampleProps = {
  calendar: CalendarSystem;
  title: string;
  description: string;
  format: CalendarDisplayFormat;
  label?: string;
  showActionButtons?: boolean;
  withDefaultValue?: boolean;
  target?: TargetKind;
};

function CalendarSystemExample({
  calendar,
  title,
  description,
  format,
  label,
  showActionButtons = true,
  withDefaultValue = true,
  target = "input",
}: CalendarSystemExampleProps) {
  const initialDate = withDefaultValue ? defaultDate : null;
  const anchorRef = useRef<HTMLInputElement | HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | null>(initialDate);
  const [text, setText] = useState(() =>
    formatCalendarDate(initialDate, format, { calendar })
  );

  const commit = (next: Date | null) => {
    setDate(next);
    setText(formatCalendarDate(next, format, { calendar }));
  };

  return (
    <article className="example-card" dir={calendar === "gregorian" ? "ltr" : "rtl"}>
      <div className="example-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <code>{format}</code>
      </div>

      {target === "input" ? (
        <input
          ref={anchorRef as RefObject<HTMLInputElement>}
          className="date-target date-input"
          value={text}
          placeholder={format}
          aria-label={title}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            const nextText = event.target.value;
            setText(nextText);
            setDate(parseCalendarDate(nextText, format, { calendar }));
          }}
        />
      ) : (
        <span
          ref={anchorRef as RefObject<HTMLSpanElement>}
          className="date-target date-span"
          role="button"
          tabIndex={0}
          aria-label={title}
          onClick={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          {text || (calendar === "gregorian" ? "Choose date" : "انتخاب تاریخ")}
        </span>
      )}

      <div className="mode-badge">
        {calendar === "gregorian"
          ? `${showActionButtons ? "Confirm/Cancel footer" : "Immediate selection"}${label ? " · With header" : " · No header"}`
          : `${showActionButtons ? "با دکمه‌های تأیید و انصراف" : "انتخاب فوری بدون Footer"}${label ? " · دارای Header" : " · بدون Header"}`}
      </div>

      <JalaliDatepicker
        calendar={calendar}
        open={open}
        anchorRef={anchorRef}
        value={date}
        label={label}
        showActionButtons={showActionButtons}
        onConfirm={commit}
        onClose={() => setOpen(false)}
      />
    </article>
  );
}

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
  const groupRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | null>(defaultDate);
  const [text, setText] = useState(() =>
    formatJalaliDate(defaultDate, format, "fa")
  );

  const commit = (next: Date | null) => {
    setDate(next);
    setText(formatJalaliDate(next, format, "fa"));
  };

  return (
    <article className="example-card">
      <div className="example-heading">
        <div>
          <h2>Input Group با آیکن تقویم</h2>
          <p>بازشدن تقویم با دکمه آیکن و نمایش تاریخ در input</p>
        </div>
        <code>{format}</code>
      </div>

      <div ref={groupRef} className="calendar-input-group">
        <input
          className="calendar-group-input"
          value={text}
          placeholder={format}
          aria-label="تاریخ Input Group"
          onChange={(event) => {
            const nextText = event.target.value;
            setText(nextText);
            setDate(parseJalaliDate(nextText, format, "fa"));
          }}
        />
        <button
          type="button"
          className="calendar-icon-button"
          aria-label="باز کردن تقویم Input Group"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
          </svg>
        </button>
      </div>

      <div className="mode-badge">بازشدن فقط با آیکن</div>

      <JalaliDatepicker
        open={open}
        anchorRef={groupRef}
        value={date}
        label="تاریخ Input Group"
        locale="fa"
        showActionButtons
        onConfirm={commit}
        onClose={() => setOpen(false)}
      />
    </article>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "jalali" | "islamic" | "gregorian" | "other"
  >("jalali");
  const tabs = [
    { id: "jalali" as const, label: "تقویم شمسی" },
    { id: "islamic" as const, label: "تقویم قمری" },
    { id: "gregorian" as const, label: "تقویم میلادی" },
    { id: "other" as const, label: "سایر مثال‌ها" },
  ];

  return (
    <main className="playground" dir="rtl">
      <header className="page-header">
        <span className="eyebrow">flexible-multi-calendar-datepicker</span>
        <h1>مشاهده تمام تقویم‌ها</h1>
        <p>
          برای بررسی تمام فرمت‌ها، Header و Footer اختیاری و روش‌های مختلف
          استفاده، تقویم موردنظر را انتخاب کنید.
        </p>
      </header>

      <nav className="calendar-tabs" aria-label="انتخاب نوع تقویم" role="tablist">
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

      {activeTab === "jalali" && <section className="demo-section" role="tabpanel">
        <div className="section-heading">
          <h2>تمام حالت‌های تقویم شمسی</h2>
          <p>فرمت عددی و نوشتاری، Header و Footer اختیاری و بازه غیرفعال</p>
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

          <PickerExample
            title="نمایش نوشتاری تاریخ"
            description="نام روز و ماه به همراه Header دلخواه"
            target="input"
            format="dddd, DD MMMM YYYY"
            showActionButtons={true}
            label="تاریخ تحویل"
            initialValue={defaultDate}
          />
        </div>
      </section>}

      {activeTab === "islamic" && <section className="demo-section" role="tabpanel">
        <div className="section-heading">
          <h2>تمام حالت‌های تقویم هجری قمری</h2>
          <p>فرمت‌های عددی و نوشتاری با Header و Footer اختیاری</p>
        </div>

        <div className="examples-grid input-grid">
          <CalendarSystemExample calendar="islamic" title="تاریخ قمری با مقدار پیش‌فرض" description="فرمت عددی و دکمه‌های تأیید و انصراف" format="YYYY/MM/DD" label="التاريخ الهجري" />
          <CalendarSystemExample calendar="islamic" title="انتخاب فوری قمری" description="بدون Header و Footer؛ بسته‌شدن پس از انتخاب" format="DD/MM/YYYY" label="" showActionButtons={false} withDefaultValue={false} />
          <CalendarSystemExample calendar="islamic" title="نام کوتاه ماه قمری" description="ترکیب روز، نام ماه و سال قمری" format="DD MMM YYYY" label="تاريخ العقد" />
          <CalendarSystemExample calendar="islamic" title="تاریخ کامل قمری" description="نام روز و نام کامل ماه قمری" format="dddd, DD MMMM YYYY" label="موعد التسليم" />
        </div>
      </section>}

      {activeTab === "gregorian" && <section className="demo-section" role="tabpanel">
        <div className="section-heading">
          <h2>تمام حالت‌های تقویم میلادی</h2>
          <p>رابط انگلیسی، اعداد لاتین و Header و Footer اختیاری</p>
        </div>

        <div className="examples-grid input-grid">
          <CalendarSystemExample calendar="gregorian" title="Gregorian numeric date" description="Default value with Confirm and Cancel buttons" format="YYYY-MM-DD" label="Start date" />
          <CalendarSystemExample calendar="gregorian" title="Immediate Gregorian selection" description="No Header or Footer; closes after selecting a day" format="DD/MM/YYYY" label="" showActionButtons={false} withDefaultValue={false} />
          <CalendarSystemExample calendar="gregorian" title="Short month name" description="Latin day, month name and year" format="DD MMM YYYY" label="Delivery date" />
          <CalendarSystemExample calendar="gregorian" title="Full Gregorian date" description="Weekday and full month name" format="dddd, DD MMMM YYYY" label="Appointment date" />
        </div>
      </section>}

      {activeTab === "other" && <section className="demo-section" role="tabpanel">
        <div className="section-heading">
          <h2>سایر مثال‌ها</h2>
          <p>نمونه‌های Span، فرمت‌های مختلف و Input Group دارای آیکن تقویم</p>
        </div>

        <div className="examples-grid input-grid other-examples">
          <InputGroupExample />
          <CalendarSystemExample calendar="islamic" target="span" title="Span با تقویم قمری" description="بازشدن تقویم قمری از یک عنصر غیر Input" format="DD MMM YYYY" label="تاریخ قمری" />
          <CalendarSystemExample calendar="gregorian" target="span" title="Gregorian calendar on Span" description="Open the Gregorian picker from a custom element" format="MMMM DD, YYYY" label="Selected date" showActionButtons={false} />
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
    </main>
  );
}
