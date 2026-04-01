// AutocompleteAlumno.jsx
import React, { useState, useRef, useEffect } from "react";

const AutocompleteAlumno = ({ alumnos, value, onChange, disabled, grados }) => {
  const [query,    setQuery]    = useState("");
  const [abierto,  setAbierto]  = useState(false);
  const [highlight,setHighlight]= useState(0);
  const inputRef = useRef(null);
  const listRef  = useRef(null);

  // Cuando cambia el value externo, mostrar el nombre en el input
  useEffect(() => {
    if (!value) { setQuery(""); return; }
    const alumno = alumnos.find(a => a._id === value);
    if (alumno) setQuery(alumno.nombre_completo);
  }, [value, alumnos]);

  const gradoNombre = (a) => {
    if (!grados) return "";
    return grados.find(g => g._id === (a.grado_a_matricular?._id || a.grado_a_matricular))?.grado || "";
  };

  const filtrados = alumnos.filter(a =>
    a.nombre_completo?.toLowerCase().includes(query.toLowerCase()) ||
    gradoNombre(a)?.toLowerCase().includes(query.toLowerCase())
  );

  const seleccionar = (alumno) => {
    setQuery(alumno.nombre_completo);
    setAbierto(false);
    onChange(alumno._id);
  };

  const limpiar = () => {
    setQuery("");
    onChange("");
    setAbierto(false);
    inputRef.current?.focus();
  };

  // Teclado — flechas + enter
  const onKeyDown = (e) => {
    if (!abierto) { if (e.key === "ArrowDown") setAbierto(true); return; }
    if (e.key === "ArrowDown")  setHighlight(h => Math.min(h + 1, filtrados.length - 1));
    if (e.key === "ArrowUp")    setHighlight(h => Math.max(h - 1, 0));
    if (e.key === "Enter" && filtrados[highlight]) seleccionar(filtrados[highlight]);
    if (e.key === "Escape") setAbierto(false);
  };

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.closest("[data-autocomplete]")?.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll automático al item resaltado
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[highlight];
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlight]);

  return (
    <div data-autocomplete="true" style={{ position: "relative" }}>
      {/* Input */}
      <div style={ac.inputWrap}>
        <svg style={ac.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          style={{ ...ac.input, paddingRight: value ? 32 : 12 }}
          placeholder={disabled ? "Selecciona un grado primero..." : "Buscar alumno por nombre o grado..."}
          value={query}
          disabled={disabled}
          onChange={e => { setQuery(e.target.value); setAbierto(true); setHighlight(0); onChange(""); }}
          onFocus={() => setAbierto(true)}
          onKeyDown={onKeyDown}
        />
        {/* Botón limpiar */}
        {(query || value) && !disabled && (
          <button style={ac.clearBtn} onClick={limpiar} title="Limpiar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {abierto && !disabled && (
        <div style={ac.dropdown}>
          {filtrados.length === 0 ? (
            <div style={ac.empty}>
              {alumnos.length === 0
                ? "No hay alumnos en este grado."
                : "No se encontraron coincidencias."}
            </div>
          ) : (
            <ul ref={listRef} style={ac.list}>
              {/* Opción vacía */}
              <li
                style={{ ...ac.item, ...(highlight === -1 ? ac.itemActive : {}) }}
                onMouseDown={() => { onChange(""); setQuery(""); setAbierto(false); }}
              >
                <span style={ac.sinAsignar}>— Sin asignar alumno —</span>
              </li>
              {filtrados.map((a, i) => {
                const gNom = gradoNombre(a);
                const isActive = highlight === i;
                return (
                  <li
                    key={a._id}
                    style={{ ...ac.item, ...(isActive ? ac.itemActive : {}) }}
                    onMouseDown={() => seleccionar(a)}
                    onMouseEnter={() => setHighlight(i)}
                  >
                    <div style={ac.alumnoNombre}>{a.nombre_completo}</div>
                    {gNom && <div style={ac.alumnoGrado}>{gNom}</div>}
                  </li>
                );
              })}
            </ul>
          )}
          <div style={ac.footer}>
            {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
};

const ac = {
  inputWrap:   { position:"relative", display:"flex", alignItems:"center" },
  searchIcon:  { position:"absolute", left:10, width:15, height:15, color:"#a78bfa", pointerEvents:"none", flexShrink:0 },
  input:       { width:"100%", background:"#faf5ff", border:"1px solid #ddd6fe", borderRadius:8, padding:"9px 12px 9px 32px", fontSize:"0.875rem", color:"#1e1b4b", outline:"none", boxSizing:"border-box", transition:"border 0.15s" },
  clearBtn:    { position:"absolute", right:8, background:"none", border:"none", cursor:"pointer", color:"#9ca3af", display:"flex", alignItems:"center", padding:4, borderRadius:4 },
  dropdown:    { position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"#ffffff", border:"1px solid #ddd6fe", borderRadius:10, boxShadow:"0 8px 32px rgba(99,102,241,0.12)", zIndex:200, overflow:"hidden" },
  list:        { listStyle:"none", margin:0, padding:"4px 0", maxHeight:220, overflowY:"auto" },
  item:        { padding:"9px 14px", cursor:"pointer", transition:"background 0.1s" },
  itemActive:  { background:"#f5f3ff" },
  alumnoNombre:{ fontSize:"0.875rem", fontWeight:600, color:"#1e1b4b" },
  alumnoGrado: { fontSize:"0.75rem", color:"#7c3aed", marginTop:2 },
  sinAsignar:  { fontSize:"0.85rem", color:"#9ca3af", fontStyle:"italic" },
  empty:       { padding:"14px", textAlign:"center", color:"#9ca3af", fontSize:"0.85rem" },
  footer:      { padding:"6px 14px", borderTop:"1px solid #f3f4f6", fontSize:"0.73rem", color:"#9ca3af", textAlign:"right" },
};

export default AutocompleteAlumno;