import React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface TypeFilterEntry {
  key: string;
  label: string;
  /** Keywords matched (case-insensitive) against product name. Empty array = match-all (use for "ALL"). */
  keywords: string[];
}

interface Product {
  name: string;
}

interface Props<T extends Product> {
  products: T[];
  filters: TypeFilterEntry[];
  active: string;
  onChange: (key: string) => void;
  resultCount: number;
  resultLabel?: string;
  sortValue?: string;
  sortOptions?: { label: string; value: string }[];
  onSortChange?: (value: string) => void;
}

export const matchesType = (productName: string, filter: TypeFilterEntry): boolean => {
  if (!filter.keywords || filter.keywords.length === 0) return true;
  const lower = productName.toLowerCase();
  return filter.keywords.some((kw) => lower.includes(kw));
};

export default function TypeFilterBar<T extends Product>({
  products,
  filters,
  active,
  onChange,
  resultCount,
  resultLabel = "RESULT",
  sortValue,
  sortOptions,
  onSortChange,
}: Props<T>) {
  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of filters) {
      map[f.key] = products.filter((p) => matchesType(p.name, f)).length;
    }
    return map;
  }, [products, filters]);

  const [sortOpen, setSortOpen] = React.useState(false);
  const sortRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const activeSort = sortOptions?.find((o) => o.value === sortValue);

  return (
    <div
      className="dvsk-type-filter"
      style={{
        marginBottom: "40px",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Result count + sort dropdown row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
        <span style={{ fontSize: "11px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", textTransform: "uppercase" }}>
          {resultCount} {resultCount === 1 ? resultLabel : `${resultLabel}S`}
        </span>

        {sortOptions && onSortChange && (
          <div ref={sortRef} style={{ position: "relative" }}>
            <button
              onClick={() => setSortOpen((v) => !v)}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.85)",
                padding: "4px 0",
                fontSize: "11px",
                letterSpacing: "0.25em",
                cursor: "pointer",
                fontFamily: "'Jost', sans-serif",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "color 0.25s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
            >
              <span style={{ color: "rgba(255,255,255,0.4)" }}>SORT —</span>
              <span style={{ fontWeight: 500 }}>{activeSort?.label || "Featured"}</span>
              <ChevronDown size={11} style={{ transform: sortOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s", color: "rgba(255,255,255,0.5)" }} />
            </button>

            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  background: "#0c0c0c",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "8px 0",
                  minWidth: "240px",
                  zIndex: 50,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
                }}
              >
                {sortOptions.map((opt) => {
                  const isActive = opt.value === sortValue;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onSortChange(opt.value);
                        setSortOpen(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
                        padding: "11px 22px",
                        fontSize: "12px",
                        letterSpacing: "0.15em",
                        cursor: "pointer",
                        fontFamily: "'Jost', sans-serif",
                        textTransform: "uppercase",
                        transition: "color 0.2s ease, background 0.2s ease",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      {isActive && (
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "2px",
                            height: "14px",
                            background: "#8B2BE2",
                            boxShadow: "0 0 8px rgba(139,43,226,0.6)",
                          }}
                        />
                      )}
                      {opt.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Editorial tab nav with sliding underline */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          flexWrap: "wrap",
          paddingBottom: "0",
          marginBottom: "-1px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
        className="filter-tabs-row"
      >
        {filters.map((f) => {
          const isActive = active === f.key;
          const count = counts[f.key] ?? 0;
          const isEmpty = count === 0 && f.keywords.length > 0;
          return (
            <button
              key={f.key}
              onClick={() => !isEmpty && onChange(f.key)}
              disabled={isEmpty}
              style={{
                background: "transparent",
                border: "none",
                padding: "10px 14px 14px",
                fontSize: "11px",
                letterSpacing: "0.28em",
                cursor: isEmpty ? "not-allowed" : "pointer",
                fontFamily: "'Jost', sans-serif",
                textTransform: "uppercase",
                color: isActive
                  ? "#fff"
                  : isEmpty
                  ? "rgba(255,255,255,0.18)"
                  : "rgba(255,255,255,0.5)",
                position: "relative",
                whiteSpace: "nowrap",
                fontWeight: isActive ? 500 : 400,
                transition: "color 0.3s ease",
                display: "inline-flex",
                alignItems: "baseline",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                if (!isActive && !isEmpty) e.currentTarget.style.color = "rgba(255,255,255,0.85)";
              }}
              onMouseLeave={(e) => {
                if (!isActive && !isEmpty) e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}
            >
              <span>{f.label}</span>
              <sup
                style={{
                  fontSize: "9px",
                  color: isActive ? "rgba(139, 43, 226, 0.95)" : "rgba(255,255,255,0.3)",
                  letterSpacing: "0",
                  fontWeight: 500,
                }}
              >
                {count}
              </sup>
              {isActive && (
                <motion.span
                  layoutId="filter-tab-underline"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "1px",
                    background: "linear-gradient(90deg, transparent 0%, #8B2BE2 20%, #c084fc 50%, #8B2BE2 80%, transparent 100%)",
                    boxShadow: "0 0 8px rgba(139,43,226,0.5)",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        .filter-tabs-row::-webkit-scrollbar { display: none; }
        @media (max-width: 640px) {
          .dvsk-type-filter { margin-bottom: 24px !important; }
          .dvsk-type-filter > div:first-child { gap: 10px !important; margin-bottom: 14px !important; }
          .dvsk-type-filter span,
          .dvsk-type-filter button { font-size: 10px !important; }
          .filter-tabs-row { gap: 6px !important; }
          .filter-tabs-row button { padding: 9px 16px !important; font-size: 10px !important; }
        }
      `}</style>
    </div>
  );
}
