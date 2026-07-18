// Разметка планировщика. Держим строкой: логика в planner-core.js императивная,
// перекладывать её на React-состояние ради галочки — только плодить ошибки.
export const PLANNER_HTML = `<div class="layout">
    <div class="panel">
      <div class="bar">
        <span class="panel-title" style="align-self:center;margin-right:4px">Форма</span>
        <button class="btn" type="button" data-shape="rect">Прямоугольник</button>
        <button class="btn" type="button" data-shape="l">Г-образная</button>
        <button class="btn" type="button" data-shape="niche">Со стояком</button>
      </div>
      <div class="bar">
        <span class="panel-title" style="align-self:center;margin-right:4px">Добавить</span>
        <button class="btn" type="button" data-add="wc">Унитаз</button>
        <button class="btn" type="button" data-add="bath">Ванна</button>
        <button class="btn" type="button" data-add="shower">Душ</button>
        <button class="btn" type="button" data-add="vanity">Тумба</button>
        <button class="btn" type="button" data-add="sink">Раковина</button>
        <button class="btn" type="button" data-add="tall">Пенал</button>
        <button class="btn" type="button" data-add="bidet">Биде</button>
        <button class="btn" type="button" data-add="mirror">Зеркало</button>
      </div>
      <div class="canvas-wrap">
        <svg class="plan" id="plan" viewBox="0 0 1000 700" role="application" aria-label="План санузла"></svg>
      </div>
      <div class="notes" id="notes"></div>
      <div class="hint" id="hint">Нажмите на предмет — появятся поворот, удаление и замена</div>
    </div>

    <div style="display:grid;gap:18px">
      <div class="panel">
        <div class="dims">
          <div class="field"><label for="rw">Ширина, мм</label><input type="number" id="rw" min="1200" max="8000" step="50"></div>
          <div class="field"><label for="rh">Глубина, мм</label><input type="number" id="rh" min="1200" max="8000" step="50"></div>
          <div class="field"><label for="rm">Площадь, м²</label><input type="number" id="rm" min="2" max="40" step="0.1"></div>
        </div>
        <table>
          <tbody id="items"></tbody>
          <tfoot><tr><td>Итого</td><td class="num mono" id="total">0 ₸</td></tr></tfoot>
        </table>
      </div>

      <div class="panel">
        <div class="panel-head"><span class="panel-title">Бюджет</span>
          <button class="btn solid" type="button" id="fitBudget">Подобрать</button></div>
        <div class="budget">
          <input type="range" id="bslider" min="0" max="100" value="55">
          <div class="brow"><span class="mono" id="bmin">—</span>
            <span class="bval mono" id="bval">—</span>
            <span class="mono" id="bmax">—</span></div>
          <div class="bnote" id="bnote">Добавьте предметы — покажу, во что уложитесь.</div>
        </div>
      </div>

      <div class="panel" id="selPanel" hidden>
        <div class="panel-head">
          <span class="panel-title" id="selTitle">Предмет</span>
          <span style="display:flex;gap:6px">
            <button class="btn" type="button" id="rot">Повернуть</button>
            <button class="btn ghost-warn" type="button" id="del">Убрать</button>
          </span>
        </div>
        <div class="alts" id="alts"></div>
      </div>
    </div>
  </div>

`;

export const PLANNER_CSS = `.pl{--paper:#f4f6f5;--card:#fff;--ink:#17211f;--ink-soft:#5a6b68;--line:#cbd6d3;--line-strong:#8fa39f;--accent:#0f6a63;--accent-soft:#d9ebe8;--warn:#a8492f;--warn-soft:#f6e3dd;--ceramic:#e6ecec;--shadow:0 1px 2px rgba(23,33,31,.06),0 8px 24px -12px rgba(23,33,31,.18);color:var(--ink);font-size:15px;line-height:1.55;font-family:"Helvetica Neue",Helvetica,"Segoe UI",Arial,sans-serif}
.pl .layout{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:20px;align-items:start}
@media(max-width:1000px){.pl .layout{grid-template-columns:minmax(0,1fr)}}
.pl .panel{background:var(--card);border:1px solid var(--line);border-radius:4px;box-shadow:var(--shadow)}
.pl .panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.pl .panel-title{font-size:10.5px;text-transform:uppercase;letter-spacing:.13em;color:var(--ink-soft);font-weight:600}
.pl .canvas-wrap{padding:10px;overflow-x:auto}
.pl svg.plan{display:block;width:100%;height:auto;min-width:480px;touch-action:none}
.pl svg.plan .fixture, .pl svg.plan .door{cursor:grab}
.pl svg.plan .vh{cursor:move}
.pl .bar{display:flex;flex-wrap:wrap;gap:6px;padding:10px 14px;border-bottom:1px solid var(--line)}
.pl .btn{font:inherit;font-size:12.5px;padding:5px 11px;cursor:pointer;background:var(--paper);
    color:var(--ink-soft);border:1px solid var(--line);border-radius:999px;white-space:nowrap}
.pl .btn:hover{border-color:var(--line-strong);color:var(--ink)}
.pl .btn[aria-pressed="true"]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent);font-weight:600}
.pl .btn.solid{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}
.pl .btn.solid:hover{opacity:.9;color:#fff}
.pl .btn.ghost-warn{color:var(--warn);border-color:var(--warn)}
.pl .btn:disabled{opacity:.4;cursor:not-allowed}
.pl input:focus-visible, .pl button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.pl .notes{padding:10px 14px;display:grid;gap:6px;border-top:1px solid var(--line)}
.pl .note{display:flex;gap:9px;align-items:flex-start;font-size:13px;line-height:1.45}
.pl .note .dot{flex:0 0 auto;width:6px;height:6px;border-radius:50%;margin-top:6px}
.pl .note.ok .dot{background:var(--accent)}
.pl .note.warn .dot{background:var(--warn)}
.pl .note.warn{color:var(--warn)}
.pl .hint{padding:9px 14px;font-size:12.5px;color:var(--ink-soft);border-top:1px solid var(--line)}
.pl .stat{display:flex;align-items:baseline;justify-content:space-between;padding:9px 14px;border-bottom:1px solid var(--line)}
.pl .stat .big{font-size:20px;font-weight:600}
.pl table{width:100%;border-collapse:collapse}
.pl tbody td{padding:8px 14px;border-bottom:1px solid var(--line);vertical-align:top;font-size:13.5px}
.pl tbody tr:last-child td{border-bottom:0}
.pl tbody tr.pickable{cursor:pointer}
.pl tbody tr.pickable:hover{background:var(--paper)}
.pl tbody tr.sel{background:var(--accent-soft)}
.pl td.num{text-align:right;white-space:nowrap}
.pl .swatch{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:7px;border:1px solid var(--line-strong)}
.pl .item-meta{color:var(--ink-soft);font-size:12px}
.pl tfoot td{padding:11px 14px;border-top:1.5px solid var(--line-strong);font-weight:600}
.pl .alts{max-height:300px;overflow-y:auto}
.pl .alt{display:grid;grid-template-columns:1fr auto;gap:3px 12px;padding:8px 14px;border:0;border-bottom:1px solid var(--line);
    cursor:pointer;background:none;width:100%;text-align:left;font:inherit;color:inherit}
.pl .alt:hover{background:var(--paper)}
.pl .alt[disabled]{opacity:.42;cursor:not-allowed}
.pl .alt .an{grid-area:1/1;font-size:13px;font-weight:500;line-height:1.35}
.pl .alt .ap{grid-area:1/2;font-size:13px;white-space:nowrap;text-align:right}
.pl .alt .am{grid-area:2/1;font-size:11.5px;color:var(--ink-soft)}
.pl .alt .ad{grid-area:2/2;font-size:11.5px;white-space:nowrap;text-align:right}
.pl .ad.up{color:var(--warn)}
.pl .ad.down{color:var(--accent)}
.pl .alt.current{background:var(--accent-soft)}
.pl .empty{padding:14px;color:var(--ink-soft);font-size:13px}
.pl .dims{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line)}
.pl .field{display:grid;gap:4px}
.pl .field label{font-size:9.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-soft);font-weight:600}
.pl .dims input{width:100%;padding:7px 8px;font:inherit;font-size:14px;font-family:ui-monospace,Menlo,monospace;
    background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:3px}
.pl .budget{padding:12px 14px;display:grid;gap:9px}
.pl .budget input[type=range]{width:100%;accent-color:var(--accent);cursor:pointer}
.pl .brow{display:flex;align-items:baseline;justify-content:space-between;font-size:11.5px;color:var(--ink-soft)}
.pl .bval{font-size:19px;font-weight:600;color:var(--ink)}
.pl .bnote{font-size:12.5px;line-height:1.45;color:var(--ink-soft)}
.pl .bnote.over{color:var(--warn)}
.pl .bnote.ok{color:var(--accent)}
`;
