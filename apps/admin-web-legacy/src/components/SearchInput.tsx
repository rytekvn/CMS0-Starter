// Input tim kiem dung chung (debounce khi can).
export function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input className="search-input" value={value} onChange={(e) => onChange(e.target.value)} />;
}
