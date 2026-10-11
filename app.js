import { ALL_FIELDS, GROUPS, STEPS, ARCHIVE_STEPS, ARCHIVE_FIELDS, SUBJECT_TYPES, STORAGE_KEY, counselorFor, contactDefaults, createDraft, updateCounselor, newResume, newRelative, validateDraft, validateArchiveReview, chineseDate, escapeHtml as e, loadDraft, saveDraft } from './core.js';

const $ = selector => document.querySelector(selector);
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const restored = loadDraft(storage);
let draft = restored.draft;
let step = 0, face = 'front', checked = false, saveTimer, toastTimer, overflowIssues = [], frame;
let examConfirmation = '';
const documentState = { student: { step: 0, checked: false, touched: new Set() }, archive: { step: 0, checked: false, touched: new Set() } };
const isArchive = () => draft.activeDocument === 'archive';
const currentSteps = () => isArchive() ? ARCHIVE_STEPS : STEPS;
const currentIssues = () => isArchive() ? validateArchiveReview(draft, examConfirmation) : validateDraft(draft);
let savePaused = !!restored.error;
let touched = documentState[draft.activeDocument].touched;
const storageNotice = document.createElement('div');
storageNotice.className = 'storage-notice';
storageNotice.setAttribute('role', 'alert');
storageNotice.hidden = !restored.error;
$('.workspace').before(storageNotice);
if (restored.error) storageNotice.textContent = `${restored.error} 自动保存已暂停，清空草稿后可重新开始。`;

function toast(message) {
  clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false;
  toastTimer = setTimeout(() => $('#toast').hidden = true, 5500);
}
function persist() {
  clearTimeout(saveTimer);
  if (savePaused) return;
  const result = saveDraft(storage, draft);
  $('#save-status').classList.toggle('save-error', !result.ok);
  $('#save-status').textContent = result.ok ? `已保存 ${new Date(result.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' })}` : '保存失败';
  storageNotice.hidden = result.ok;
  if (!result.ok) storageNotice.textContent = result.message;
}
function scheduleSave() {
  if (savePaused) return;
  $('#save-status').textContent = '正在保存…';
  clearTimeout(saveTimer); saveTimer = setTimeout(persist, 260);
}
function nav() {
  $('#step-navigation').innerHTML = currentSteps().map((item, i) => `<button type="button" data-step="${i}" class="step-button ${step === i ? 'active' : ''}" ${step === i ? 'aria-current="step"' : ''}><span class="step-number">${i + 1}</span><span>${item.short}</span></button>`).join('');
}
function updateDocumentChrome() {
  document.body.dataset.document = draft.activeDocument;
  document.title = isArchive() ? '新生档案审查表 · 填写练习' : '学籍卡 · 填写练习';
  for (const button of $('#document-navigation').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.document === draft.activeDocument));
  $('#face-tabs').hidden = isArchive();
  $('#archive-preview-label').hidden = !isArchive();
  $('#preview-title').textContent = isArchive() ? '审查表预览' : '纸卡预览';
  $('#dialog-title').textContent = isArchive() ? '新生档案审查表核对预览' : '正反面核对预览';
  $('#preview-tip-text').textContent = isArchive() ? '仅填写学生基本信息。档案审查结论、问题说明、签字与盖章均留空，由老师核对后在纸表中完成。' : '预览会随着填写更新。空白部分保留原样，奖励与处分如无可留空。';
  $('.intro-tags span:last-child').textContent = isArchive() ? '完整模板 · 竖向 A4' : '支持正反面预览';
}
function switchDocument(value) {
  if (!['student', 'archive'].includes(value) || value === draft.activeDocument) return;
  documentState[draft.activeDocument].step = step;
  documentState[draft.activeDocument].checked = checked;
  draft.activeDocument = value;
  step = documentState[value].step; checked = documentState[value].checked; touched = documentState[value].touched;
  overflowIssues = [];
  $('#check-summary').textContent = '先完成填写，再一起检查格式。'; $('#check-summary').className = 'check-summary';
  renderStep(true); afterChange();
}
function control(metadata, value, binding = '') {
  const { key, label, type, hint, required, wide, options, placeholder, autocomplete, inputmode, maxlength, suggestions, readonly } = metadata;
  const id = `field-${key}`;
  const attributes = `id="${e(id)}" name="${e(key)}" ${binding || `data-field="${e(key)}"`} ${required ? 'required aria-required="true"' : ''} ${readonly ? 'readonly' : ''} aria-describedby="${e(id)}-hint ${e(id)}-error" ${autocomplete ? `autocomplete="${e(autocomplete)}"` : 'autocomplete="off"'} ${inputmode ? `inputmode="${inputmode}"` : ''} ${maxlength ? `maxlength="${maxlength}"` : ''}`;
  const input = type === 'select'
    ? `<select ${attributes}><option value="">请选择${e(label)}</option>${options.map(option => `<option value="${e(option)}" ${value === option ? 'selected' : ''}>${e(option)}</option>`).join('')}</select>`
    : type === 'textarea'
      ? `<textarea ${attributes} rows="3" placeholder="${e(placeholder || '按实际情况填写')}">${e(value)}</textarea>`
      : `<input ${attributes} type="${type}" value="${e(value)}" placeholder="${e(placeholder || '按实际情况填写')}">`;
  return `<div class="field ${wide ? 'wide' : ''}"><label for="${e(id)}">${e(label)}${required ? '<span class="required-dot" aria-label="必填">*</span>' : ''}${metadata.optional ? '<span class="optional-label">可留空</span>' : ''}</label>${input}${suggestions ? `<div class="suggestions">${suggestions.map(value => `<button type="button" data-suggestion="${e(key)}" data-value="${e(value)}">${e(value)}</button>`).join('')}</div>` : ''}<p id="${e(id)}-hint" class="field-hint">${e(hint || '')}</p><p id="${e(id)}-error" class="field-error" hidden></p></div>`;
}
function fieldsFor(group) { return `<div class="form-grid">${group.map(metadata => control(metadata, draft.fields[metadata.key])).join('')}</div>`; }
function archiveForm() {
  const fields = ARCHIVE_FIELDS.map(metadata => {
    if (metadata.key === 'subjectType') return control(metadata, draft.archiveReview.subjectType, 'data-review-field="subjectType"');
    let html = control(metadata, draft.fields[metadata.key]);
    if (metadata.key === 'examId') html += control({ key: 'examConfirmation', label: '再次输入考生号', type: 'text', required: true, wide: true, inputmode: 'numeric', placeholder: '对照原始高考材料，再次输入', hint: '两次内容需一致；刷新页面或修改考生号后，请重新确认。' }, examConfirmation, 'data-confirm-input');
    return html;
  }).join('');
  return `<div class="candidate-note"><span aria-hidden="true">!</span><div><strong>考生号，务必逐位核对</strong><p>这是高考考号，请对照原始高考材料填写。专业和班级使用本班统一名称。</p></div></div><div class="form-grid">${fields}</div><div class="inline-note archive-scope-note">下面的档案审查结论及签章位置只在预览中展示，留给老师填写。</div>`;
}
function archiveReviewForm() {
  const done = ARCHIVE_FIELDS.filter(f => (f.key === 'subjectType' ? draft.archiveReview.subjectType : draft.fields[f.key]).trim()).length;
  return `<div class="review-hero"><span class="review-icon" aria-hidden="true">✓</span><h3>把考生号再核对一次</h3><p>已填写 ${done} / 9 项基本信息</p><progress class="review-progress" value="${done}" max="9" aria-label="基本信息填写进度"></progress></div><div class="review-actions"><button class="button primary" data-action="validate" type="button">检查全部信息</button><button class="button secondary" data-action="expand" type="button">查看完整表格</button></div><div id="review-results" class="review-results" aria-live="polite"></div><div class="checklist"><h3>抄写前核对清单</h3><p>① 考生号与原始高考材料逐位一致。</p><p>② 专业、班级与本班老师通知的统一名称一致。</p><p>③ 生源地已具体到县、区或县级市；直辖市填写市与区县。</p><p>④ 科类填写准确，档案审查及签章区域留空。</p></div><button class="button print-button" data-action="print" type="button">打印 / 另存 PDF <span aria-hidden="true">↗</span></button><p class="field-hint">当前仅导出审查表：竖向 A4，一页。手机浏览器若不提供打印，可使用电脑浏览器。</p>`;
}
function counselorCard() {
  const counselor = counselorFor(draft.fields.major);
  if (!counselor) return '<div class="inline-note">先在基本信息中选择专业，即可查看对应辅导员信息。</div>';
  return `<div class="counselor-card"><span class="counselor-avatar" aria-hidden="true">${e(counselor.name[0])}</span><div><span class="section-kicker">YOUR COUNSELOR</span><h3>${e(counselor.name)}<span>辅导员</span></h3><p>${e(draft.fields.major)}</p><div class="counselor-details"><span>联系方式请以本班老师通知为准</span></div></div></div>`;
}
function rowControl(collection, row, key, label, type = 'text', placeholder = '', wide = false) {
  const fullKey = `${collection}.${row.id}.${key}`;
  return control({ key: fullKey, label, type, placeholder, wide }, row[key], `data-row="${e(row.id)}" data-collection="${collection}" data-row-field="${key}"`);
}
function resumeForm() {
  return `${counselorCard()}<div class="repeat-list">${draft.resume.map((row, i) => `<section class="repeat-card" aria-label="简历第${i + 1}段"><div class="repeat-heading"><div><span class="record-number">${String(i + 1).padStart(2, '0')}</span><h3>${e(row.stage || '新增经历')}</h3></div><button class="text-button danger" type="button" data-remove="resume" data-id="${e(row.id)}">删除</button></div><div class="form-grid">${rowControl('resume', row, 'stage', '阶段', 'text', '如：小学、初中、高中、大学')}${rowControl('resume', row, 'start', '自何年何月', 'month')}${rowControl('resume', row, 'end', '至何年何月', 'month')}<div class="ongoing-field"><label class="checkbox-label"><input type="checkbox" data-collection="resume" data-row="${e(row.id)}" data-row-field="ongoing" ${row.ongoing ? 'checked' : ''}> 至今（仍在就读或任职）</label></div>${rowControl('resume', row, 'organization', '在何地、何学校、何单位、任何职', 'textarea', '填写所在地、学校或单位及任职', true)}${rowControl('resume', row, 'witness', '证明人', 'text', row.stage === '高中' ? '一般填写高中老师姓名' : row.stage === '大学' ? '填写对应辅导员姓名' : '填写可证明这段经历的人员姓名')}</div></section>`).join('')}</div><button class="button add-button" data-add="resume" type="button">＋ 添加一段经历</button>`;
}
function relativesForm() {
  return `<div class="inline-note">请如实填写工作单位或任职；退休、务农等情况，可按实际情况填写。</div><div class="repeat-list">${draft.relatives.map((row, i) => `<section class="repeat-card" aria-label="亲属第${i + 1}位"><div class="repeat-heading"><div><span class="record-number">${String(i + 1).padStart(2, '0')}</span><h3>亲属信息</h3></div><button class="text-button danger" type="button" data-remove="relatives" data-id="${e(row.id)}">删除</button></div><div class="form-grid">${rowControl('relatives', row, 'relation', '称呼', 'text', '如：父亲、母亲')}${rowControl('relatives', row, 'name', '姓名')}${rowControl('relatives', row, 'employment', '在何工作单位任何职', 'textarea', '工作单位及任职；按实际情况填写', true)}</div></section>`).join('')}</div><button class="button add-button" data-add="relatives" type="button">＋ 添加一位亲属</button>`;
}
function reviewForm() {
  if (isArchive()) return archiveReviewForm();
  const required = ALL_FIELDS.filter(f => f.required);
  const done = required.filter(f => draft.fields[f.key].trim()).length;
  return `<div class="review-hero"><span class="review-icon" aria-hidden="true">✓</span><h3>落笔前，再确认一次</h3><p>已填写 ${done} / ${required.length} 项核心信息</p><div class="progress-track"><div class="progress-bar progress-${done}"></div></div></div><div class="review-actions"><button class="button primary" data-action="validate" type="button">检查全部信息</button><button class="button secondary" data-action="expand" type="button">查看正反面</button></div><div id="review-results" class="review-results" aria-live="polite"></div><div class="checklist"><h3>抄写前核对清单</h3><p>① 姓名、身份证号与原证件逐位一致。</p><p>② 专业使用全称，办学形式填写全日制。</p><p>③ 地址、电话及简历证明人已核实。</p><p>④ 已请老师当面核对，准备由本人填写纸卡。</p></div><button class="button print-button" data-action="print" type="button">打印 / 另存 PDF <span aria-hidden="true">↗</span></button><p class="field-hint">打印的是核对稿。手机浏览器若不提供打印功能，可在电脑浏览器中使用。</p>`;
}
function renderStep(focus = false) {
  updateDocumentChrome(); nav(); const metadata = currentSteps()[step];
  $('#step-kicker').textContent = `STEP ${metadata.mark} / ${String(currentSteps().length).padStart(2, '0')}`;
  $('#step-title').textContent = metadata.title;
  $('#step-description').textContent = metadata.description;
  $('#step-mark').textContent = metadata.mark;
  $('#step-position').textContent = `${step + 1} / ${currentSteps().length}`;
  $('#previous-step').disabled = step === 0;
  $('#next-step').hidden = step === currentSteps().length - 1;
  $('#step-content').innerHTML = isArchive() ? (step === 0 ? archiveForm() : reviewForm()) : step <= 1 ? fieldsFor(GROUPS[step]) : step === 2
    ? `<fieldset class="contact-choice"><legend>是否需要填写本地联系人？</legend><p>由学生根据学校要求确认；不需要时，纸卡相关栏位保持空白。</p><div class="choice-options"><label><input type="radio" name="contactNeeded" value="yes" ${draft.contactNeeded === 'yes' ? 'checked' : ''}> 需要填写</label><label><input type="radio" name="contactNeeded" value="no" ${draft.contactNeeded === 'no' ? 'checked' : ''}> 不需要填写</label></div></fieldset>${counselorCard()}${draft.contactNeeded === 'yes' ? `${fieldsFor(GROUPS[2])}<button class="button secondary" type="button" data-action="reset-contact">恢复对应辅导员默认信息</button>` : '<div class="inline-note">辅导员信息也可用于大学简历的证明人。</div>'}`
    : step === 3 ? resumeForm() : step === 4 ? relativesForm() : reviewForm();
  for (const row of draft.resume) {
    const end = document.getElementById(`field-resume.${row.id}.end`);
    if (end) end.disabled = row.ongoing;
  }
  updateFeedback();
  if (focus) $('#step-title').focus({ preventScroll: true });
}
function goToStep(index, focus = true) {
  step = Math.max(0, Math.min(currentSteps().length - 1, index));
  if (!isArchive()) {
    if (step === 3 || step === 4) setFace('back');
    else if (step < 3) setFace('front');
  }
  renderStep(focus);
  if (window.innerWidth < 960 && focus) $('.editor').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
function cell(key, span = 3, extra = '') {
  const metadata = (isArchive() ? ARCHIVE_FIELDS : ALL_FIELDS).find(f => f.key === key);
  let value = draft.fields[key];
  if (metadata?.type === 'date' || metadata?.type === 'month') value = chineseDate(value);
  if (GROUPS[2].some(f => f.key === key) && draft.contactNeeded !== 'yes') value = '';
  return `<td colspan="${span}" class="value-cell ${extra}"><div class="fit-box ${extra === 'large-cell' ? 'large-box' : ''}" data-fit-key="${key}" data-fit-label="${e(metadata?.label || key)}"><span>${e(value)}</span></div></td>`;
}
const label = (text, span = 2, extra = '') => `<th colspan="${span}" ${extra}>${e(text)}</th>`;
function frontPaper() {
  return `<article class="paper front-paper" aria-label="学籍卡正面"><h3 class="paper-title">西安外国语大学学生学籍卡片</h3><div class="paper-date">填表时间　${e(chineseDate(draft.fields.filledDate)) || '　　 年　 月　 日'}</div><div class="paper-table-wrap"><table class="front-table"><colgroup>${'<col>'.repeat(18)}</colgroup><tbody>
    <tr><td colspan="3" rowspan="6" class="photo-cell">照<br>片<br><small>（二寸）</small></td>${label('学号')}${cell('studentId')}${label('姓名')}${cell('name')}${label('办学形式')}${cell('educationMode')}</tr>
    <tr>${label('考号')}${cell('examId')}${label('所在学院')}${cell('college')}${label('专业')}${cell('major')}</tr>
    <tr>${label('所在班')}${cell('className')}${label('性别')}${cell('gender')}${label('出生日期')}${cell('birthDate')}</tr>
    <tr>${label('入学年月')}${cell('enrollmentMonth')}${label('生源地')}${cell('origin')}${label('政治面貌')}${cell('politics')}</tr>
    <tr>${label('民族')}${cell('ethnicity')}${label('健康状况')}${cell('health')}${label('宗教')}${cell('religion')}</tr>
    <tr>${label('身份证号')}${cell('idNumber')}${label('家庭详细地址')}${cell('familyAddress')}${label('特长')}${cell('skills')}</tr>
    <tr>${label('家长姓名')}${cell('parentName')}${label('与自己关系')}${cell('parentRelation', 2)}${label('家长单位')}${cell('parentEmployer')}${label('家庭邮编')}${cell('familyPostal', 2)}</tr>
    <tr>${label('单位邮编')}${cell('parentPostal')}${label('单位电话')}${cell('parentPhone', 2)}${label('家长职务')}${cell('parentRole')}${label('侨居地')}${cell('residence', 2)}</tr>
    <tr>${label('外地学生在本地的联系人', 3, 'rowspan="2"')}${label('联系人姓名')}${cell('contactName')}${label('与联系人关系')}${cell('contactRelation')}${label('联系人电话')}${cell('contactPhone')}</tr>
    <tr>${label('联系人邮编')}${cell('contactPostal')}${label('联系人地址')}${cell('contactAddress', 8)}</tr>
    <tr class="award-row">${label('何时何地因何种原因受过何种奖励', 3)}${cell('awards', 6, 'large-cell')}${label('何时何地因何种原因受过何种处分', 3)}${cell('punishments', 6, 'large-cell')}</tr>
    </tbody></table></div><div class="paper-notes"><span>注：1、本卡片须学生本人填写。</span><span>2、侨居地是指学生家庭在非户口所在地的住址。</span></div></article>`;
}
function backPaper() {
  const count = Math.max(6, draft.resume.length, draft.relatives.length);
  const record = (value, key, text) => `<td><div class="fit-box" data-fit-key="${e(key)}" data-fit-label="${e(text)}"><span>${e(value)}</span></div></td>`;
  const rows = Array.from({ length: count }, (_, i) => {
    const r = draft.resume[i], f = draft.relatives[i];
    return `<tr class="record-row">${record(r ? chineseDate(r.start) : '', r ? `resume.${r.id}.start` : '', '简历开始年月')}${record(r ? r.ongoing ? '至今' : chineseDate(r.end) : '', r ? `resume.${r.id}.end` : '', '简历结束年月')}${record(r?.organization || '', r ? `resume.${r.id}.organization` : '', '简历学校、单位及任职')}${record(r?.witness || '', r ? `resume.${r.id}.witness` : '', '简历证明人')}${record(f?.relation || '', f ? `relatives.${f.id}.relation` : '', '亲属称呼')}${record(f?.name || '', f ? `relatives.${f.id}.name` : '', '亲属姓名')}${record(f?.employment || '', f ? `relatives.${f.id}.employment` : '', '亲属工作单位及任职')}</tr>`;
  }).join('');
  return `<article class="paper back-paper" aria-label="学籍卡反面"><div class="back-table-wrap" data-record-fit><table class="back-table"><colgroup><col class="col-start"><col class="col-end"><col class="col-school"><col class="col-proof"><col class="col-relation"><col class="col-name"><col class="col-employment"></colgroup><thead><tr><th colspan="4">本人简历（从小学填起）</th><th colspan="3">直系亲属主要社会关系</th></tr><tr><th>自何年何月</th><th>至何年何月</th><th>在何地、何学校、何单位、任何职</th><th>证明人</th><th>称呼</th><th>姓名</th><th>在何工作单位任何职</th></tr></thead><tbody>${rows}</tbody></table></div></article>`;
}
function archivePaper() {
  const box = selected => `<span class="paper-checkbox ${selected ? 'is-checked' : ''}" aria-label="${selected ? '已选' : '未选'}">${selected ? '✓' : ''}</span>`;
  const meta = (key, text) => `<div class="archive-meta-item"><span>${text}</span><div class="fit-box" data-fit-key="${key}" data-fit-label="${text}"><span>${e(draft.fields[key])}</span></div></div>`;
  const staffRows = (names, category, paper) => names.map((name, i) => `<tr class="archive-record ${paper && [0, 3].includes(i) ? 'archive-tall' : ''}">${i === 0 ? `<th rowspan="4" class="archive-category">${category}</th>` : ''}<td class="archive-item-name">${i + 1}、${name}</td><td data-staff-cell>${box(false)}</td><td colspan="2" data-staff-cell>${paper && i === 3 ? `<div class="bonus-question">是否获得高考加分：${box(false)}</div><div class="bonus-question">是否具有加分资格材料：${box(false)}</div>` : ''}</td></tr>`).join('');
  return `<article class="paper archive-paper" aria-label="新生档案审查表"><h3 class="paper-title">西安外国语大学新生档案审查表</h3><div class="archive-meta">${meta('college', '学院')}${meta('major', '专业')}${meta('className', '班级')}</div><div class="archive-table-wrap"><table class="archive-table"><colgroup><col class="archive-col-group"><col class="archive-col-category"><col class="archive-col-name"><col class="archive-col-status"><col class="archive-col-basic-label"><col class="archive-col-problem"></colgroup><tbody>
    <tr class="archive-basic-row"><th rowspan="3" class="vertical-heading">基本信息</th><th>考生号</th>${cell('examId', 2)}<th>身份证号</th>${cell('idNumber', 1)}</tr>
    <tr class="archive-basic-row"><th>姓名</th>${cell('name', 2)}<th>生源地</th>${cell('origin', 1)}</tr>
    <tr class="archive-basic-row"><th>性别</th><td colspan="2"><div class="paper-options">${['男', '女'].map(value => `<span>${value}${box(draft.fields.gender === value)}</span>`).join('')}</div></td><th>科类</th><td><div class="paper-subject-options">${SUBJECT_TYPES.slice(0, 3).map(value => `<span>${value}${box(draft.archiveReview.subjectType === value)}</span>`).join('')}</div><div class="paper-subject-options">${SUBJECT_TYPES.slice(3).map(value => `<span>${value}${box(draft.archiveReview.subjectType === value)}</span>`).join('')}</div></td></tr>
    <tr class="archive-table-heading"><th rowspan="10" class="vertical-heading">档案审查</th><th>档案类别</th><th>名称</th><th>审查合格</th><th colspan="2">审查出现问题</th></tr>
    ${staffRows(['学籍档案', '志愿表', '体检表', '其他'], '纸介质档案审查情况', true)}
    ${staffRows(['报名登记表', '考生信息表', '体检表', '其他表格'], '电子档案审查情况', false)}
    <tr class="archive-consistency"><td colspan="5" data-staff-cell>纸介质档案与电子档案是否一致：　是${box(false)}　否${box(false)}（原因）<span class="reason-line"></span></td></tr>
    </tbody></table></div><div class="archive-notes"><strong>备注：</strong><div><p>1、请在相应的方框内打 √。</p><p>2、如在电子档案审查时有其他表格，请详细注明。</p><p>3、请各学院在核对无误后将本表放入学生档案中并留存。</p></div></div><div class="archive-signatures"><div>辅导员签字：<span></span></div><div>学院负责人签字：<span></span></div><div class="archive-seal">学院盖章</div></div></article>`;
}
function measureOverflow() {
  const result = [];
  for (const box of $('#print-root').querySelectorAll('.fit-box')) {
    if (box.firstElementChild.textContent && (box.scrollHeight > box.clientHeight + 1 || box.scrollWidth > box.clientWidth + 1)) result.push({ key: box.dataset.fitKey, label: box.dataset.fitLabel });
  }
  const back = $('#print-root [data-record-fit]');
  if (back && back.firstElementChild.getBoundingClientRect().height > back.getBoundingClientRect().height + 2) result.push({ key: 'resume', label: '背面条目数量' });
  overflowIssues = result.filter((item, i, list) => list.findIndex(other => item.key === other.key) === i);
  for (const box of document.querySelectorAll('.fit-box')) box.classList.toggle('overfilled', overflowIssues.some(item => item.key === box.dataset.fitKey));
  $('#overflow-status').hidden = !overflowIssues.length;
  $('#overflow-status').textContent = overflowIssues.length ? `${overflowIssues.map(x => x.label).join('、')}超出纸卡空间，请调整后打印。` : '';
  updateFeedback();
}
function updatePreviews() {
  $('#print-root').dataset.document = draft.activeDocument;
  $('#paper-stage').innerHTML = isArchive() ? archivePaper() : face === 'front' ? frontPaper() : backPaper();
  $('#print-root').innerHTML = isArchive() ? archivePaper() : frontPaper() + backPaper();
  if ($('#preview-dialog').open) $('#expanded-papers').innerHTML = isArchive() ? `<div class="expanded-sheet archive-expanded">${archivePaper()}</div>` : `<div class="expanded-sheet"><h3>正面</h3>${frontPaper()}</div><div class="expanded-sheet"><h3>反面</h3>${backPaper()}</div>`;
  cancelAnimationFrame(frame); frame = requestAnimationFrame(measureOverflow);
}
function setFace(value) {
  face = value;
  for (const tab of ['front', 'back']) { $(`#${tab}-tab`).classList.toggle('active', face === tab); $(`#${tab}-tab`).setAttribute('aria-pressed', String(face === tab)); }
  updatePreviews();
}
function issueLabel(issue) {
  if (issue.key === 'examConfirmation') return '考生号复核';
  const metadata = (isArchive() ? ARCHIVE_FIELDS : ALL_FIELDS).find(f => f.key === issue.key);
  return metadata?.label || (issue.key.startsWith('resume') ? '本人简历' : issue.key.startsWith('relatives') ? '直系亲属' : '本地联系人');
}
function updateFeedback() {
  const issues = currentIssues();
  for (const element of $('#step-content').querySelectorAll('[data-field], [data-row-field], [data-review-field], [data-confirm-input]')) {
    const key = element.dataset.field || element.dataset.reviewField || (element.hasAttribute('data-confirm-input') ? 'examConfirmation' : `${element.dataset.collection}.${element.dataset.row}.${element.dataset.rowField}`);
    const entries = issues.filter(issue => issue.key === key);
    const visible = (checked || touched.has(key)) && entries.length;
    const error = document.getElementById(`${element.id}-error`);
    element.setAttribute('aria-invalid', String(!!(visible && entries.some(issue => issue.severity === 'error'))));
    element.classList.toggle('input-warning', !!(visible && entries.every(issue => issue.severity === 'warning')));
    if (error) { error.hidden = !visible; error.textContent = visible ? entries.map(x => x.message).join(' ') : ''; error.classList.toggle('warning-text', !!(visible && entries.every(issue => issue.severity === 'warning'))); }
  }
  if (!checked) return;
  const errors = issues.filter(x => x.severity === 'error');
  const warnings = issues.filter(x => x.severity === 'warning');
  const message = errors.length ? `还有 ${errors.length} 项格式或必填问题，请修改。` : overflowIssues.length ? '文字超出纸表空间，请调整后打印。' : `${isArchive() ? '基本信息' : ''}格式检查通过，请老师核对后抄写。${warnings.length ? `另有 ${warnings.length} 项待核对提示。` : ''}`;
  $('#check-summary').textContent = message;
  $('#check-summary').classList.toggle('summary-error', !!errors.length || !!overflowIssues.length);
  $('#check-summary').classList.toggle('summary-success', !errors.length && !overflowIssues.length);
  const target = $('#review-results');
  if (target) target.innerHTML = `<div class="result-banner ${errors.length || overflowIssues.length ? 'result-error' : 'result-success'}">${e(message)}</div>${overflowIssues.length ? `<div class="result-list"><h3>纸卡空间提醒</h3>${overflowIssues.map(item => `<button type="button" data-focus-key="${e(item.key)}">${e(item.label)}：超出可填写空间 <span aria-hidden="true">→</span></button>`).join('')}</div>` : ''}${errors.length ? `<div class="result-list"><h3>需要修改 · ${errors.length}</h3>${errors.map(issue => `<button type="button" data-focus-key="${e(issue.key)}" data-focus-step="${issue.step}"><span>${e(issueLabel(issue))}</span>${e(issue.message)} <b aria-hidden="true">→</b></button>`).join('')}</div>` : ''}${warnings.length ? `<details class="warning-list" open><summary>请老师核对 · ${warnings.length} 项</summary>${warnings.map(issue => `<button type="button" data-focus-key="${e(issue.key)}" data-focus-step="${issue.step}">${e(issue.message)} <span aria-hidden="true">→</span></button>`).join('')}</details>` : ''}`;
}
function afterChange() { scheduleSave(); updatePreviews(); updateFeedback(); }
function handleInput(event) {
  const target = event.target;
  if (target.dataset.field) {
    const key = target.dataset.field;
    if (key === 'educationMode') { target.value = '全日制'; return; }
    const previousMajor = draft.fields.major;
    if (key === 'examId' && target.value !== draft.fields.examId) {
      examConfirmation = '';
      const confirmInput = $('#field-examConfirmation');
      if (confirmInput) confirmInput.value = '';
      documentState.archive.touched.delete('examConfirmation');
    }
    draft.fields[key] = target.value;
    if (key === 'major') {
      const retained = updateCounselor(draft, previousMajor);
      if (retained.length) toast('已更新辅导员默认信息；手动修改的内容已保留，请再次核对。');
    }
    afterChange();
  } else if (target.dataset.reviewField) {
    draft.archiveReview[target.dataset.reviewField] = target.value;
    afterChange();
  } else if (target.hasAttribute('data-confirm-input')) {
    examConfirmation = target.value;
    updateFeedback();
  } else if (target.dataset.rowField) {
    const row = draft[target.dataset.collection].find(row => row.id === target.dataset.row);
    const key = target.dataset.rowField;
    row[key] = target.type === 'checkbox' ? target.checked : target.value;
    if (key === 'ongoing') document.getElementById(`field-resume.${row.id}.end`).disabled = row.ongoing;
    if (key === 'stage') {
      target.closest('.repeat-card').querySelector('.repeat-heading h3').textContent = row.stage || '新增经历';
      document.getElementById(`field-resume.${row.id}.witness`).placeholder = row.stage === '高中' ? '一般填写高中老师姓名' : row.stage === '大学' ? '填写对应辅导员姓名' : '填写可证明这段经历的人员姓名';
    }
    if (key === 'stage' && row.stage === '大学' && !row.witness) {
      row.witness = counselorFor(draft.fields.major)?.name || '';
      const witness = document.getElementById(`field-resume.${row.id}.witness`);
      if (witness) witness.value = row.witness;
    }
    afterChange();
  }
}
$('#step-content').addEventListener('input', handleInput);
$('#step-content').addEventListener('change', event => {
  if (event.target.name === 'contactNeeded') {
    draft.contactNeeded = event.target.value;
    if (draft.contactNeeded === 'yes') updateCounselor(draft, draft.fields.major);
    renderStep(); afterChange();
  }
});
$('#step-content').addEventListener('focusout', event => {
  const target = event.target;
  if (target.dataset.field) {
    const key = target.dataset.field;
    if (key === 'idNumber') { draft.fields[key] = draft.fields[key].trim().toUpperCase(); target.value = draft.fields[key]; }
    else { draft.fields[key] = draft.fields[key].trim(); target.value = draft.fields[key]; }
    touched.add(key); afterChange();
  } else if (target.hasAttribute('data-confirm-input')) {
    examConfirmation = examConfirmation.trim(); target.value = examConfirmation;
    touched.add('examConfirmation'); updateFeedback();
  } else if (target.dataset.reviewField) {
    touched.add(target.dataset.reviewField); updateFeedback();
  } else if (target.dataset.rowField && target.type !== 'checkbox') {
    const row = draft[target.dataset.collection].find(row => row.id === target.dataset.row);
    if (!row) return;
    row[target.dataset.rowField] = row[target.dataset.rowField].trim(); target.value = row[target.dataset.rowField];
    touched.add(`${target.dataset.collection}.${target.dataset.row}.${target.dataset.rowField}`); afterChange();
  }
});
$('#step-content').addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.suggestion) {
    draft.fields[button.dataset.suggestion] = button.dataset.value;
    document.getElementById(`field-${button.dataset.suggestion}`).value = button.dataset.value;
    touched.add(button.dataset.suggestion); afterChange();
  }
  if (button.dataset.add) { draft[button.dataset.add].push(button.dataset.add === 'resume' ? newResume() : newRelative()); renderStep(); afterChange(); }
  if (button.dataset.remove) {
    const collection = button.dataset.remove, row = draft[collection].find(x => x.id === button.dataset.id);
    const hasContent = Object.entries(row).some(([key, value]) => !['id', 'stage', 'ongoing'].includes(key) && value);
    if (hasContent && !confirm('删除这条已填写的记录？')) return;
    draft[collection] = draft[collection].filter(x => x.id !== button.dataset.id); renderStep(); afterChange();
  }
  if (button.dataset.action === 'reset-contact' && confirm('将本地联系人恢复为当前专业辅导员的默认信息？')) { Object.assign(draft.fields, contactDefaults(draft.fields.major)); renderStep(); afterChange(); }
  if (button.dataset.action === 'validate') runCheck();
  if (button.dataset.action === 'expand') expand();
  if (button.dataset.action === 'print') print();
  if (button.dataset.focusKey) {
    const key = button.dataset.focusKey;
    const index = isArchive() ? 0 : button.dataset.focusStep !== undefined ? Number(button.dataset.focusStep) : key.startsWith('resume') ? 3 : key.startsWith('relatives') ? 4 : GROUPS.findIndex(group => group.some(field => field.key === key));
    goToStep(index < 0 ? 3 : index);
    const input = document.getElementById(`field-${key}`) || (key === 'contactNeeded' ? document.querySelector('input[name="contactNeeded"]') : $('#step-content'));
    if (!input.hasAttribute('tabindex') && input.tagName === 'DIV') input.tabIndex = -1;
    input.focus(); input.scrollIntoView({ block: 'center', behavior: 'instant' });
  }
});
function runCheck() { checked = true; goToStep(currentSteps().length - 1); updateFeedback(); }
function expand() { $('#preview-dialog').showModal(); updatePreviews(); }
function print() {
  checked = true; measureOverflow();
  if (overflowIssues.length) { $('#preview-dialog').close(); goToStep(currentSteps().length - 1); toast('请先缩短超出格子的文字或减少条目，确保核对稿完整。'); return; }
  persist();
  if (typeof window.print !== 'function') return toast('当前浏览器不支持打印，请使用电脑或系统浏览器打开。');
  try { window.print(); } catch { toast('无法打开打印，请使用电脑或系统浏览器。'); }
}
$('#step-navigation').addEventListener('click', event => { const button = event.target.closest('[data-step]'); if (button) goToStep(Number(button.dataset.step)); });
$('#document-navigation').addEventListener('click', event => { const button = event.target.closest('[data-document]'); if (button) switchDocument(button.dataset.document); });
$('#previous-step').addEventListener('click', () => goToStep(step - 1));
$('#next-step').addEventListener('click', () => goToStep(step + 1));
$('#front-tab').addEventListener('click', () => setFace('front'));
$('#back-tab').addEventListener('click', () => setFace('back'));
$('#expand-preview').addEventListener('click', expand);
$('#close-preview').addEventListener('click', () => $('#preview-dialog').close());
$('#dialog-edit').addEventListener('click', () => $('#preview-dialog').close());
$('#dialog-print').addEventListener('click', print);
$('#check-all').addEventListener('click', runCheck);
$('#clear-draft').addEventListener('click', () => {
  if (!confirm('清空当前浏览器中的学籍卡和新生档案审查表两份草稿？共用信息也会清空，此操作无法撤销。')) return;
  clearTimeout(saveTimer);
  try { storage?.removeItem(STORAGE_KEY); } catch { toast('浏览器无法删除本地草稿，当前页面已重置；请检查本地存储权限。'); }
  const activeDocument = draft.activeDocument;
  draft = createDraft(); draft.activeDocument = activeDocument; examConfirmation = '';
  for (const state of Object.values(documentState)) { state.touched.clear(); state.checked = false; state.step = 0; }
  touched = documentState[activeDocument].touched; checked = false; savePaused = false;
  $('#check-summary').textContent = '先完成填写，再一起检查格式。'; $('#check-summary').className = 'check-summary';
  step = 0; face = 'front'; setFace('front'); renderStep(); persist();
});
window.addEventListener('pagehide', () => { if (saveTimer) persist(); });
window.addEventListener('resize', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measureOverflow); });
window.addEventListener('beforeprint', () => { measureOverflow(); });
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY) {
    clearTimeout(saveTimer); savePaused = true;
    storageNotice.hidden = false; storageNotice.textContent = '另一个标签页已更新或清空草稿。当前页面自动保存已暂停，请先保留当前内容，再刷新以查看最新草稿。';
    $('#save-status').textContent = '自动保存已暂停'; $('#save-status').classList.add('save-error');
  }
});
$('#save-status').textContent = restored.error ? '自动保存已暂停' : restored.restored ? '已恢复本机草稿' : '尚未填写';
$('#save-status').classList.toggle('save-error', !!restored.error);
renderStep(); updatePreviews();
