# تصميم نظام الـ RAG الطبي — NASA Space Apps 2026

Nov 13, 2026 · @Youssef Mohammad

التصميم ده بيغطي جزء الـ RAG كامل، من ملفات ناسا الخام لحد خدمة FastAPI بتطلّع **endpoint-ين** للـ Backend الأساسي: واحد للاسترجاع بس، وواحد لتوليد خطة التصرف الموثّقة.

افتراض: فهمت "الاتنين API" إنهم endpoint الاسترجاع وendpoint التوليد جوه خدمة الـ RAG. لو قصدك API الـ ML + API الـ RAG، التصميم يتحمّل ده من غير تغيير: الـ Backend ينادي `/ml/predict` وبعدها `/v1/guidance/generate`.

## النطاق والمسؤوليات

الـ RAG service بياخد نتيجة الـ ML (label + ثقة) مع القراءات، ويرجّع خطوات تصرف موثّقة من مصادر ناسا؛ هو مش بيشخّص، والـ severity بتتحسب بـ rules مش بالـ LLM.

| الجزء | المسؤول | بيعمل إيه |
| --- | --- | --- |
| Backend الأساسي | فريق الـ Backend | يستقبل القراءات الخام، ينادي الـ ML ثم الـ RAG، ويعرض النتيجة |
| ML service | زميلك | Anomaly Detection حالياً، ويطلّع anomaly\_label وconfidence\_score (مفيش Classification في الدليل) |
| Rule-based checks | RAG service (دالة في shared/ يقدر الـ Backend يستخدمها) | حدود صارمة ترفع الخطورة فقط ولا تنزّلها أبداً |
| **RAG service** | **إنت** | استرجاع البروتوكول، توليد الخطة، الـ validation، والـ citations |

### الـ contract بين الـ ML والـ RAG

الـ Backend بيبعت للـ RAG نتيجة الـ ML مع القراءات اللي دخلت الموديل، وبنفس أسماء الأعمدة في دليل الـ ML حرفياً. الاتفاق ده لازم يتقفل مع زميلك قبل أي كود:

```json
{
  "request_id": "9f1c2a7e",
  "astronaut_id": "A-03",
  "timestamp": "2026-11-14T10:32:00Z",
  "ml": {"anomaly_label": 1, "confidence_score": 0.942},
  "vitals": {
    "heart_rate_bpm": 118.0,
    "hrv_rmssd_ms": 21.4,
    "spo2_percent": 88.2,
    "body_temperature_c": 37.1,
    "respiratory_rate_bpm": 24.0,
    "systolic_bp_mmhg": 104.0,
    "diastolic_bp_mmhg": 68.0,
    "heart_rate_bpm_rolling_mean_60min": 96.4,
    "heart_rate_bpm_rolling_std_60min": 9.8,
    "hrv_rmssd_ms_rolling_mean_60min": 38.2,
    "hrv_rmssd_ms_rolling_std_60min": 7.1,
    "spo2_percent_rolling_mean_60min": 93.1,
    "spo2_percent_rolling_std_60min": 2.4,
    "body_temperature_c_rolling_mean_60min": 36.9,
    "body_temperature_c_rolling_std_60min": 0.1,
    "respiratory_rate_bpm_rolling_mean_60min": 19.2,
    "respiratory_rate_bpm_rolling_std_60min": 2.6
  },
  "window_count": 12
}
```

القيم في المثال للتجربة بس.

قواعد الـ contract:

- `ml` هو مخرجات الموديل زي ما هي: `anomaly_label` (0 أو 1) و`confidence_score` (من 0 لـ 1). الدليل بيوصف الـ score بإنه ثقة الموديل في قراره، يعني 0.94 مع label 0 هو ثقة إن الحالة طبيعية؛ أكّد ده مع زميلك.
- `vitals` هو الـ 17 عمود (7 لحظية + 10 rolling لآخر 60 دقيقة) بأسمائها الحرفية من الدليل. ضغط الدم ما ليهوش rolling.
- الموديل مش بيرجّع condition ولا severity ولا top\_features. الـ RAG بيشتقهم بنفسه: الـ severity من الـ label + الـ rules، والـ condition كفرضيات "suspected" من الـ rules وتحليل الـ LLM.
- `window_count` حقل مقترح (اختياري): عدد القراءات الفعلية في نافذة الـ rolling. لو أقل من 12 الـ std ممكن يبقى 0.0 زي مثال الدليل (أول قراءة)، فالـ RAG بيتجاهل الـ z-score ومبيعتبرش الـ std مؤشر استقرار.
- الـ severity بيحسبها الـ RAG: `Normal` لو label = 0 ومفيش rule اتفعّلت، `Warning` لو label = 1 أو أي rule من نوع warning، `Critical` لو أي rule من نوع critical (حتى لو label = 0). الـ LLM ما بيرفعش ولا بينزّل الـ severity.
- الـ rules في `rules.yaml` بحدود Warning وCritical لكل قراءة، ودالة بسيطة في `shared/` يقدر الـ Backend يستخدمها كمان. الحدود لازم تتراجع مع مصدر طبي ومفيش حد بيتكتب من الـ LLM. شكل القاعدة: `spo2_percent < 90` ← critical (مثال placeholder).

## المعمارية

&#91;embedded content: architecture · offline index build + online request path\]

الـ endpoint الأول (`/v1/protocols/retrieve`) بيقف عند صندوق API 1 ويرجّع الـ chunks والمراجع، والتاني (`/v1/guidance/generate`) بيكمّل لحد API 2. أي فشل في الـ LLM أو في الفحوصات بيحوّل الرد لـ Extractive mode، والـ Index store بيتبني أوفلاين وبيتحمّل مرة واحدة عند الـ startup.

## مصادر المعرفة

الـ LLM بياخد خطوات التصرف من مصادر الإجراءات (Tier 1) بس، ومصادر المعايير والخلفية بتدعم السياق والحدود والتصعيد.

| المصدر | Tier | دوره في النظام |
| --- | --- | --- |
| [Shuttle Medical Checklist JSC-48031, Rev K (2006)](https://ibiblio.org/apollo/Shuttle/Medical%20Checklist/Medical%20Checklist%20Rev%20K%20PCN-4.pdf) و[Rev H (2001)](https://ibiblio.org/apollo/Shuttle/Medical%20Checklist/Medical%20Checklist%20Rev%20H.pdf) | 1 | أقرب نص إجرائي عام لقيته؛ من حقبة الشاتل مش ISS، فاذكر ده في العرض |
| ISS Medical Checklist | 1 | ما لقيتش نسخة كاملة عامة؛ لو التحدي أو ناسا وفّرتها تبقى المصدر الأساسي |
| [NASA-STD-3001 Vol.1 Rev C (2023)](https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf) | 2 | مستويات الرعاية الطبية وحدود التعرض ومتطلبات التشخيص؛ سياق وحدود، مش خطوات علاج |
| [NASA/TM-2017-219290: Levels of Care](https://ntrs.nasa.gov/api/citations/20170004345/downloads/20170004345.pdf) | 2 | تعريف مستويات الرعاية وأمثلة الإجراءات لكل مستوى |
| [Accepted Medical Condition List (NASA/TM-2019-220299)](https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20190027540.pdf) | 3 | قايمة الحالات الطبية للمهمات الاستكشافية؛ أساس الـ condition taxonomy |
| [IMPACT ICL 1.0](https://ntrs.nasa.gov/citations/20205008590) | 3 | قايمة حالات تانية لمقارنة الأسماء وتغطية الحالات |
| [ExMC Evidence Report: In-Flight Medical Conditions](https://ntrs.nasa.gov/api/citations/20170004604/downloads/20170004604.pdf) | 3 | خلفية وسياق لشرح الحالة، بدون خطوات |
| تاب Resources في صفحة التحدي | ؟ | أي ملفات بتوفّرها المسابقة؛ تتصنّف Tier بعد ما تتفتح |

الروابط دي من نتايج بحث يوم 13 نوفمبر 2026، وما فتحتش الملفات كاملة؛ افتحها وراجع محتواها وبيان الـ distribution بتاعها قبل ما تبني عليها. أي ملف لازم يتسجّل في `sources.yaml` بـ `doc_id` وTier ورابط وتاريخ التنزيل.

## الـ Ingestion الأوفلاين

الـ ingestion بيشتغل مرة واحدة على الملفات ويطلّع index ثابت له إصدار `index_version`، ومفيش أي نداء إنترنت وقت تشغيل الخدمة.

1. **التسجيل:** الملفات في `data/raw/`، وكل ملف له سطر في `sources.yaml` فيه `doc_id` وTier ورابط وsha256 وتاريخ التنزيل.
2. **الاستخراج:** PyMuPDF صفحة بصفحة مع الاحتفاظ برقم الصفحة. لو النص طلع فاضي أو مشوّه (ملف مصوّر)، شغّل OCR بـ ocrmypdf أو Tesseract.
3. **التنضيف:** شيل الـ headers والـ footers وأرقام الصفحات المتكررة، وصلّح الكلمات المقطّعة بشرطة، وحافظ على ترقيم الخطوات وعلامات WARNING وCAUTION وNOTE.
4. **تحديد حدود الإجراء:** من عناوين الإجراءات (regex أو layout). في الـ checklists كل إجراء = وحدة chunking واحدة.
5. **الـ Chunking:**
   - الإجراءات (Tier 1): الإجراء كامل في chunk واحد. لو زاد عن حوالي 600 token يتقسم عند حدود الخطوات، وعنوان الإجراء يتكرر في كل جزء، ومفيش قطع في نص خطوة. التحذيرات تفضل مع الخطوات اللي بتخصها.
   - المعايير والخلفية (Tier 2 و3): chunks من 300 لـ 500 token عند حدود الفقرات، مع overlap حوالي 50 token.
6. **الوسم:** `condition_tags` من الـ taxonomy (كلمات مفتاحية + مراجعة يدوية لكل chunk من Tier 1)، ومعاها `contains_steps` و`has_warning`.
7. **الـ Embeddings:** موديل محلي مثل `BAAI/bge-base-en-v1.5` (أو `e5-base-v2`) بعد normalize. نص الـ embedding = عنوان الإجراء + الـ tags + النص.
8. **الـ Index:** ChromaDB persistent collection باسم `nasa_med_v<N>`، وبجانبه BM25 index (rank\_bm25) على نفس الـ `chunk_id`s.
9. **الفحص:** لكل condition في الـ taxonomy لازم يرجع chunk واحد على الأقل من Tier 1، والحالات اللي مالهاش chunk تتسجّل كـ gaps في `coverage_report.md`.
10. **الإصدار:** `index_manifest.json` فيه `index_version` (hash للمصادر والإعدادات) وعدد الـ chunks لكل Tier، ويظهر في كل response.

### Schema الـ chunk

حقل `ref_label` هو "رقم المرجع" اللي بيرجع للـ Backend في الرد:

```json
{
  "chunk_id": "jsc48031k_proc_012_a",
  "doc_id": "jsc-48031-revk",
  "doc_title": "Medical Checklist, Generic Rev K",
  "tier": 1,
  "section": "Emergency procedures",
  "procedure_title": "<procedure title as printed>",
  "page_start": 0,
  "page_end": 0,
  "condition_tags": ["hypoxia", "respiratory_distress"],
  "contains_steps": true,
  "has_warning": true,
  "token_count": 410,
  "ref_label": "JSC-48031 Rev K, <section>, p.<n>",
  "text": "<cleaned chunk text>"
}
```

القيم في المثال placeholders؛ بتتملي من الملف الحقيقي وقت الـ ingestion.

## الـ Condition taxonomy

الموديل مش بيرجّع condition، فالقايمة دي هي الفرضيات اللي الـ RAG بيرشّحها من القراءات (rules + تحليل الـ LLM). نفس الأسماء بتتستخدم كـ tags في الـ chunks وكـ enum في الـ API. القايمة 9 conditions + fallback لأن الدليل فيه 7 مؤشرات حيوية بس.

| condition\_id | القراءات اللي بتدل عليها | مصطلحات الـ query (English) | نوع الرد المتوقع |
| --- | --- | --- | --- |
| hypoxia\_suspected | spo2\_percent، respiratory\_rate\_bpm | hypoxia, low oxygen saturation, respiratory distress | خطوات من Tier 1 |
| respiratory\_distress | respiratory\_rate\_bpm، spo2\_percent | respiratory distress, dyspnea, breathing difficulty | خطوات من Tier 1 |
| tachycardia | heart\_rate\_bpm | tachycardia, rapid heart rate | خطوات من Tier 1 |
| bradycardia | heart\_rate\_bpm | bradycardia, slow heart rate, syncope | خطوات من Tier 1 |
| hypotension | systolic\_bp\_mmhg، diastolic\_bp\_mmhg | hypotension, shock, fluid resuscitation | خطوات من Tier 1 |
| hypertension | systolic\_bp\_mmhg، diastolic\_bp\_mmhg | hypertension, elevated blood pressure | خطوات من Tier 1 |
| fever\_hyperthermia | body\_temperature\_c | fever, hyperthermia, infection, heat illness | خطوات من Tier 1 |
| hypothermia | body\_temperature\_c | hypothermia, low body temperature | خطوات من Tier 1 |
| high\_stress\_suspected | hrv\_rmssd\_ms (منخفض)، heart\_rate\_bpm | stress, autonomic response, fatigue | سياق (Tier 3) وتصعيد، بدون خطوات |

وفوقهم `unknown_anomaly` كـ fallback: لو label = 1 ومفيش rule ولا فرضية، الـ query بيتبني من القراءات اللي انحرفت أكتر عن الـ rolling mean.

اتشالت 4 conditions كانت في الإصدار الأول (radiation\_exposure\_elevated وdecompression\_sickness\_suspected وfatigue\_sleep\_deprivation وcardiac\_arrhythmia\_suspected) لأن الدليل مفيهوش مدخلات تدل عليها (جرعة إشعاع، سياق EVA، نوم، ECG). ترجع لو زميلك أضاف المدخلات دي.

الأسماء مقترح مني. بعد ما تنزّل الـ Accepted Medical Condition List قارن أسماءك بيها وعدّل، والحالات اللي مالهاش chunk من Tier 1 بعد الـ ingestion بتبان في `coverage_report.md` وبتتعامل كحالات "تصعيد بس".

## الـ Retrieval الأونلاين

الاسترجاع بيرجّع إما chunks مقبولة، أو قرار صريح إن مفيش بروتوكول مطابق؛ ومش بيدّي الـ LLM أبداً حاجة تحت حد القبول.

1. **البوابة:** لو `severity = Normal` (label = 0 ومفيش rule اتفعّلت) يرجّع `skipped` فوراً من غير بحث.
2. **بناء الـ query:** من أكتر من مصدر، مش من تشخيص واحد: مصطلحات فرضيات الـ rules من الـ taxonomy + القراءات اللي انحرفت عن الـ rolling mean بكلمات + عبارة سياق مثل "spaceflight emergency procedure". في endpoint التوليد بيتضاف عليها مصطلحات تحليل الـ LLM (القسم اللي تحت).
3. **فلتر الـ metadata:** `condition_tags` تتقاطع مع الفرضيات. الفلتر "ناعم": لو رجّع أقل من 3 مرشحين يتشال.
4. **البحث الهجين:** dense من ChromaDB (top 30) + BM25 (top 30)، ويتدمجوا بـ Reciprocal Rank Fusion بـ `k=60`.
5. **الـ Reranking:** cross-encoder مثل `BAAI/bge-reranker-base` على أفضل 20 مرشح، ونأخذ أعلى 5.
6. **بوابة القبول:** أفضل chunk من Tier 1 لازم يعدّي `TAU_PROC`. لو مفيش، النتيجة `no_protocol_found` ومفيش LLM؛ الرد بيطلب تصعيد لجراح الرحلة.

```python
def retrieve(req, analysis=None):
    sev, flags = assess(req)                  # rules + ml.anomaly_label -> severity, rule flags
    if sev == "Normal":
        return Skipped()
    dev = deviations(req.vitals, req.window_count)   # vs rolling mean; z-score only if std > 0 and window is full
    hyps = hypotheses_from_flags(flags) or ["unknown_anomaly"]
    queries = [build_query(hyps, dev)]        # deterministic query, always kept
    if analysis:                              # only /v1/guidance/generate, only if the LLM answered in time
        queries.append(build_query(analysis.condition_hypotheses, dev, analysis.query_terms))
        hyps = union(hyps, analysis.condition_hypotheses)
    pool = []
    for q in queries:
        dense = chroma.query(q.embedding, n=30, where=tag_filter(hyps))
        sparse = bm25.top_k(q.text, 30)
        pool += rrf([dense, sparse], k=60)
    top = rerank(queries[0].text, dedupe(pool))[:5]
    procedures = [c for c in top if c.tier == 1 and c.score >= TAU_PROC]
    if not procedures:
        return NoProtocol(context=top)
    context = [c for c in top if c.tier > 1][:2]
    return Retrieved(procedures=procedures[:3], context=context)
```

الأرقام دي قيم ابتدائية، وبتتظبط على الـ golden set بتاع قسم التقييم:

| Parameter | القيمة الابتدائية | بتتظبط بإيه |
| --- | --- | --- |
| dense\_k / bm25\_k | 30 / 30 | Recall@k |
| rrf\_k | 60 | ثابت عادةً |
| rerank\_in / final\_k | 20 / 5 | Recall@5 وزمن الاستجابة |
| TAU\_PROC | 0.5 (بعد sigmoid لـ score الـ reranker) | عدد حالات no\_protocol الصح والغلط |
| max\_procedures\_to\_llm | 3 | الـ context length وجودة الرد |

للحالات الـ Critical، الـ Backend بينادي endpoint الاسترجاع فوراً ويعرض الـ chunks والمرجع من غير ما يستنى الـ LLM.

### خطوة تحليل الـ LLM قبل الاسترجاع

في endpoint التوليد (`/v1/guidance/generate`) الترتيب هو: نتيجة الـ ML ← الـ LLM يفهمها ويحللها ← يطلّع مصطلحات البحث ← البحث في الـ Vector DB ← صياغة الخطة. الـ LLM هنا بيحلّل ويبني الـ query بس، ومبيكتبش أي خطوة علاجية ومبيغيّرش الـ severity.

مدخلات الـ LLM: الـ label والـ confidence، القراءات، الـ deviations (القراءة مقابل الـ rolling mean، والـ z-score لما الـ std > 0 والنافذة مليانة)، والـ rule flags، والفرضيات المرشّحة من الـ rules. الـ deviations والـ flags بتتحسب برمجياً قبل الـ LLM.

الـ LLM بيرجّع JSON ضيّق بالشكل ده:

```json
{
  "condition_hypotheses": ["hypoxia_suspected", "respiratory_distress"],
  "query_terms": ["hypoxia", "low oxygen saturation", "respiratory distress"],
  "symptoms_to_match": ["falling SpO2 trend", "rising respiratory rate"],
  "notes": "<one line, for the audit log only>"
}
```

القواعد:

- `condition_hypotheses` من الـ taxonomy بس، بحد أقصى 3، وبتتعامل كـ "suspected" مش تشخيص.
- الـ query بتاع الـ LLM بيتدمج مع الـ query البرمجي (من فرضيات الـ rules) بنفس الـ RRF، والـ query البرمجي ما بيتشالش أبداً.
- أي اختلاف بين الـ LLM والـ rules بيتسجّل `rules_llm_disagreement`، وفلتر الـ metadata بيستخدم اتحاد الفرضيتين.
- `query_terms` بحد أقصى 8، كل واحد لحد 4 كلمات بالإنجليزي.
- لو الـ LLM تخطّى ميزانية التحليل (ابتدائياً 5 ثواني) أو رجّع JSON غلط، البحث بيكمّل بالـ query البرمجي بس، و`generation.analysis = "skipped"` في الرد.
- endpoint الاسترجاع (`/v1/protocols/retrieve`) ما بيستخدمش الـ LLM، فالحالة الـ Critical ما بتستناش التحليل.

لأن الموديل مبيرجّعش condition، الخطوة دي هي اللي بتحوّل "فيه شذوذ" لحالة محتملة، فالـ rules هي الأساس والـ LLM مكمّل. وهي مفيدة أكتر في `unknown_anomaly` والحالات اللي أكتر من قراءة بتتحرك فيها مع بعض. تكلفتها زمن إضافي واحتمال إن الـ query يبعد عن الحالة، عشان كده بتتقاس في الـ ablation: deterministic بس ضد deterministic + تحليل الـ LLM على الـ golden set، وتفضل في النظام لو رفعت Recall@5 فعلاً.

## طبقة التوليد

الـ LLM بيرتّب ويصيغ الخطوات من الـ chunks المسترجعة بس؛ هو مش مصدر معرفة طبية في النظام ده.

- **التشغيل:** Ollama محلي على `localhost`، عشان النظام يفضل أوفلاين فعلاً. لو استخدمت API خارجي، شيل كلمة Offline من وصف المشروع.
- **الموديل:** من الموديلات المتاحة عندك على Ollama: MedGemma 1.5 4B مرشح أول لخطوة التحليل والتوليد لأنه طبي وصغير على 6GB VRAM. DeepSeek-R1 8B بيطلّع reasoning tokens بتصعّب الـ JSON المقيّد، فمش مرشح أول. Qwen2.5-Coder 14B مخصص للكود وكبير على 6GB. ده تقدير من الأحجام بس؛ أكّد أسماء الـ tags بـ \`ollama list\` وجرّب الموديلات على الـ golden set قبل ما تعتمد واحد.
- **الإعدادات:** `temperature=0`، `max_tokens` حوالي 600، وميزانية زمن ابتدائية: 10 ثواني للـ Critical و25 ثانية للـ Warning.
- **الإخراج:** JSON مفروض بـ schema (خاصية `format` في Ollama) + تحقق بـ Pydantic + محاولة إعادة واحدة بس.
- **الذاكرة:** موديل 8B بتكميم 4-bit محتاج تقريباً 5 لـ 6 GB RAM أو VRAM؛ الرقم تقريبي، قيسه على جهازك.
- **اللغة:** الخطوات بالإنجليزي لأنها لغة المصدر وده أسلم للتحقق. ترجمة عربية اختيارية بتتضاف بعد الـ validation في حقل منفصل `action_ar`، وما بتبقاش هي المرجع.

### الـ Prompt

```text
SYSTEM
You are a formatter for an astronaut medical decision-SUPPORT system.
RULES
1. Use ONLY the text inside <protocol_chunks>. Never add steps, drugs, doses or facts that are not in them.
2. Every action step must cite exactly one chunk_id in "source_chunk_id".
3. If the chunks do not cover the situation, return {"status":"no_protocol","steps":[]}.
4. Keep the protocol's original order and keep its WARNING/CAUTION text.
5. Never change the severity and never diagnose beyond <condition_hypotheses>, and call them suspected.
6. Output JSON only, matching the schema.

USER
<vitals>{vitals_snapshot}</vitals>
<ml_result>{anomaly_label, confidence_score}</ml_result> <rule_flags>{flags}</rule_flags> <condition_hypotheses>{hypotheses}</condition_hypotheses>
<protocol_chunks>
  <chunk id="{chunk_id}" ref="{ref_label}">{text}</chunk>
  ...
</protocol_chunks>
```

```json
{
  "status": "ok",
  "summary": "<one sentence>",
  "steps": [
    {"n": 1, "action": "<step text from the chunk>", "source_chunk_id": "<chunk_id>", "warning": null}
  ],
  "escalation": {"required": true, "reason": "<why>"},
  "protocol_refs": ["<ref_label>"]
}
```

أضف مثال few-shot واحد في الـ prompt بعد ما الـ chunks الحقيقية تتجهز، وخلّيه من حالة مش في الـ golden set عشان التقييم ما يتلخبطش.

## الـ Validation والـ Guardrails

أي رد من الـ LLM بيعدّي على 6 فحوصات قبل ما يطلع من الخدمة، وأي فحص يفشل بيحوّل الرد لـ fallback مش بيعدّيه.

| # | الفحص | لو فشل |
| --- | --- | --- |
| 1 | الـ JSON مطابق للـ Pydantic schema | محاولة إعادة واحدة، وبعدها extractive fallback |
| 2 | كل `source_chunk_id` موجود فعلاً في الـ chunks اللي اتبعتت للـ LLM | الخطوة تتشال؛ لو شالت أكتر من نص الخطوات → extractive fallback |
| 3 | كل خطوة قريبة من نص الـ chunk اللي بتستشهد بيه (cosine similarity بين embedding الخطوة والـ chunk فوق عتبة `TAU_FAITH`، تتظبط على الـ golden set) | الخطوة تتشال أو تتبدّل بنص الـ chunk نفسه |
| 4 | مفيش أرقام جرعات أو أسماء أدوية في الخطوة إلا لو موجودة حرفياً في الـ chunk المستشهد بيه | الخطوة تتشال |
| 5 | الـ severity في الرد مش أقل من الـ severity اللي طلعت من الـ rules ومن label الـ ML | الرد يتصحح للأعلى وتتسجّل `severity_raised` |
| 6 | لو Critical: لازم `escalation.required = true` وفي الرد سطر تصعيد لجراح الرحلة | الخدمة بتضيفه برمجياً، مش من الـ LLM |

### الـ Extractive fallback

لو الـ LLM بطيء أو فشل أو الفحوصات رفضت رده، الخدمة بترجّع نص الإجراء المسترجع بترتيبه الأصلي مع الـ `ref_label` بتاعه، من غير توليد. الرد بيكون أقل أناقة لكنه مضمون المصدر، والـ `status` فيه `degraded`.

### حدود الـ Guardrail

- الفحص رقم 3 بيمسك الأخطاء الواضحة بس؛ مش بديل لمراجعة بشرية على الـ golden set.
- النظام "Decision Support" مش بديل للطبيب، والـ Critical بيعمل escalation دايماً.
- الـ Rule-based checks الخاصة بالقراءات الخام دالة في shared/ بيشغّلها الـ RAG بنفسه، والـ Backend يقدر يستخدمها كمان.

## الـ APIs

الخدمة بتعرض endpoint-ين للـ Backend: واحد للاسترجاع السريع بدون LLM، وواحد للخطة الكاملة؛ الاتنين بياخدوا نفس الـ payload اللي جاي من الـ ML.

| Endpoint | الغرض | بيستخدم LLM؟ |
| --- | --- | --- |
| `POST /v1/protocols/retrieve` | يرجّع البروتوكولات المطابقة مع المراجع والـ scores | لا |
| `POST /v1/guidance/generate` | يرجّع خطة تصرف مرقّمة وموثّقة، مع fallback | آه (مع fallback) |
| `GET /health` و`GET /v1/index/info` | حالة الخدمة، وإصدار الـ index، وعدد الـ chunks، وحالة الـ Ollama | لا |

الـ Backend بيستخدم الأول فوراً في الحالات الـ Critical، وبيكمّل بالتاني للخطة الكاملة.

### Request (الاتنين)

نفس الـ contract في قسم النطاق (`ml` + `vitals`)، مع حقل اختياري `options` في الاتنين:

```json
{
  "request_id": "9f1c2a7e",
  "astronaut_id": "A-03",
  "timestamp": "2026-11-14T10:32:00Z",
  "ml": {"anomaly_label": 1, "confidence_score": 0.942},
  "vitals": {
    "heart_rate_bpm": 118.0,
    "hrv_rmssd_ms": 21.4,
    "spo2_percent": 88.2,
    "body_temperature_c": 37.1,
    "respiratory_rate_bpm": 24.0,
    "systolic_bp_mmhg": 104.0,
    "diastolic_bp_mmhg": 68.0,
    "heart_rate_bpm_rolling_mean_60min": 96.4,
    "heart_rate_bpm_rolling_std_60min": 9.8,
    "hrv_rmssd_ms_rolling_mean_60min": 38.2,
    "hrv_rmssd_ms_rolling_std_60min": 7.1,
    "spo2_percent_rolling_mean_60min": 93.1,
    "spo2_percent_rolling_std_60min": 2.4,
    "body_temperature_c_rolling_mean_60min": 36.9,
    "body_temperature_c_rolling_std_60min": 0.1,
    "respiratory_rate_bpm_rolling_mean_60min": 19.2,
    "respiratory_rate_bpm_rolling_std_60min": 2.6
  },
  "window_count": 12,
  "options": {"mode": "auto"}
}
```

### Response: `/v1/protocols/retrieve`

```json
{
  "request_id": "9f1c2a7e",
  "status": "ok",
  "severity": "Critical",
  "condition_hypotheses": ["hypoxia_suspected", "respiratory_distress"],
  "protocols": [
    {"chunk_id": "...", "ref_label": "...", "tier": 1, "score": 0.0, "text": "..."}
  ],
  "context": [],
  "escalation": {"required": true, "reason": "severity is Critical"},
  "index_version": "idx-...",
  "latency_ms": 0
}
```

### Response: `/v1/guidance/generate`

```json
{
  "request_id": "9f1c2a7e",
  "status": "ok",
  "severity": "Critical",
  "condition_hypotheses": ["hypoxia_suspected", "respiratory_distress"],
  "guidance": {
    "summary": "...",
    "steps": [
      {"n": 1, "action": "...", "source_chunk_id": "...", "ref_label": "...", "warning": null}
    ]
  },
  "protocol_refs": ["..."],
  "escalation": {"required": true, "reason": "severity is Critical"},
  "rules_triggered": ["spo2_below_90"],
  "generation": {"mode": "llm", "model": "llama3.1:8b", "checks_failed": []},
  "index_version": "idx-...",
  "service_version": "0.1.0",
  "latency_ms": 0,
  "disclaimer": "Decision support only. Not a substitute for a flight surgeon."
}
```

قيم الـ `status`: `ok` · `degraded` (الرد من الـ extractive fallback أو فحص فشل) · `no_protocol_found` (تصعيد بدون خطوات) · `skipped` (الـ severity كانت Normal).

### أخطاء الـ HTTP

| الكود | `error.code` | امتى |
| --- | --- | --- |
| 422 | `invalid_payload` | حقل ناقص أو `severity` أو `condition` برا القيم المتفق عليها |
| 401 | `unauthorized` | الـ `X-API-Key` غلط أو ناقص |
| 503 | `index_not_ready` | الـ Vector DB أو الـ BM25 index ما اتحمّلوش |
| 500 | `internal_error` | خطأ غير متوقع (والـ audit log فيه التفاصيل) |

انتهاء مهلة الـ LLM مش خطأ HTTP: بيرجع 200 بـ `status = degraded`.

### الـ Pydantic models

```python
from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field

class Severity(str, Enum):
    NORMAL = "Normal"
    WARNING = "Warning"
    CRITICAL = "Critical"

class Condition(str, Enum):
    HYPOXIA_SUSPECTED = "hypoxia_suspected"
    RESPIRATORY_DISTRESS = "respiratory_distress"
    TACHYCARDIA = "tachycardia"
    BRADYCARDIA = "bradycardia"
    HYPOTENSION = "hypotension"
    HYPERTENSION = "hypertension"
    FEVER_HYPERTHERMIA = "fever_hyperthermia"
    HYPOTHERMIA = "hypothermia"
    HIGH_STRESS_SUSPECTED = "high_stress_suspected"
    UNKNOWN_ANOMALY = "unknown_anomaly"

class MLResult(BaseModel):
    anomaly_label: Literal[0, 1]
    confidence_score: float = Field(ge=0, le=1)

class Vitals(BaseModel):
    heart_rate_bpm: float
    hrv_rmssd_ms: float
    spo2_percent: float
    body_temperature_c: float
    respiratory_rate_bpm: float
    systolic_bp_mmhg: float
    diastolic_bp_mmhg: float
    heart_rate_bpm_rolling_mean_60min: float
    heart_rate_bpm_rolling_std_60min: float
    hrv_rmssd_ms_rolling_mean_60min: float
    hrv_rmssd_ms_rolling_std_60min: float
    spo2_percent_rolling_mean_60min: float
    spo2_percent_rolling_std_60min: float
    body_temperature_c_rolling_mean_60min: float
    body_temperature_c_rolling_std_60min: float
    respiratory_rate_bpm_rolling_mean_60min: float
    respiratory_rate_bpm_rolling_std_60min: float

class Options(BaseModel):
    mode: Literal["auto", "extractive"] = "auto"

class MLPayload(BaseModel):
    request_id: str
    astronaut_id: str
    timestamp: str
    ml: MLResult
    vitals: Vitals
    window_count: int | None = Field(default=None, ge=1)
    options: Options = Options()

class Step(BaseModel):
    n: int
    action: str
    source_chunk_id: str
    ref_label: str
    warning: str | None = None

class Escalation(BaseModel):
    required: bool
    reason: str

class Guidance(BaseModel):
    summary: str
    steps: list[Step]
```

ملاحظات تشغيلية: الـ `request_id` بيرجع كمان في الـ header `X-Request-Id`، والـ endpoint-ين idempotent، والمسار فيه `/v1` عشان أي تغيير في الـ contract يبقى `/v2`.

## حالات الفشل والتدهور التدريجي

القاعدة: أي جزء يفشل بيطلّع رد أبسط بنفس ضمان المصدر، مش خطأ؛ والحالات الـ Critical ما بتستناش الـ LLM أبداً.

| السيناريو | بيتكشف إزاي | سلوك النظام | الـ status |
| --- | --- | --- | --- |
| label = 0 ومفيش rule اتفعّلت | الـ payload + الـ rules | يرجّع من غير بحث | `skipped` |
| label = 0 بس `confidence_score` تحت عتبة تتحدد مع زميلك | الـ payload | يرجّع `skipped` ويسجّل `low_confidence_normal` في الـ audit log | `skipped` |
| label = 0 لكن rule من نوع warning أو critical اتفعّلت | الـ rules | الـ severity بتترفع والاسترجاع يكمّل عادي | حسب النتيجة |
| payload ناقص أو قيمة برا النطاق | Pydantic | يرفض الطلب برسالة تحدد الحقل | HTTP 422 |
| `window_count` أقل من 12 أو الـ std = 0.0 | الـ payload | الـ z-score والـ deviations بيتخطوا، والـ rules على القراءات اللحظية تفضل شغالة | `ok` |
| label = 1 ومفيش rule ولا فرضية | الـ rules + الـ LLM | `unknown_anomaly`، والـ query من أكتر القراءات انحرافاً | `ok` أو `no_protocol_found` |
| الـ LLM فشل في خطوة التحليل أو تعدّى ميزانيتها | timeout أو JSON غلط | البحث بالـ query البرمجي بس | `ok` مع `analysis = skipped` |
| مفيش chunk من Tier 1 فوق `TAU_PROC` | بوابة القبول | يرجّع chunks السياق وتصعيد لجراح الرحلة، بدون توليد | `no_protocol_found` |
| الـ Reranker بطيء أو فشل | timeout أو exception | يكمّل بترتيب الـ RRF | `degraded` |
| ChromaDB فشل والـ BM25 شغال | exception | بحث BM25 بس مع تسجيل الحالة | `degraded` |
| الـ index ما اتحمّلش | عند الـ startup | الخدمة تقوم و`/health` يبيّن السبب، والـ endpoints بترجّع 503 | HTTP 503 |
| Ollama واقع أو تعدّت المهلة في التوليد | timeout أو connection error | extractive fallback من الـ chunks | `degraded` |
| الـ LLM رجّع JSON غلط في التوليد | Pydantic | محاولة إعادة واحدة، وبعدها extractive | `degraded` |
| فحوصات الـ validation شالت أكتر من نص الخطوات | قسم الـ Validation | extractive fallback | `degraded` |
| نفس الـ `request_id` اتبعت تاني | الـ cache | يرجّع نفس الرد من غير إعادة حساب | نفس الرد الأصلي |

### ميزانية الزمن

الأرقام دي أهداف ابتدائية؛ قيسها على جهازك وعدّلها:

- **الاسترجاع** (بحث + reranking): حوالي 2 ثانية على CPU.
- **التوليد:** 10 ثواني للـ Critical و25 ثانية للـ Warning، وبعدها fallback تلقائي.
- الـ Critical بيعرض نتيجة الاسترجاع للـ Backend فوراً من endpoint الاسترجاع، والتوليد بيجي بعدها.

كل قرار بيتسجّل في الـ audit log (JSON lines): `request_id`، الـ payload من غير بيانات حساسة، الـ chunk\_ids المسترجعة وscores، الـ status، الفحوصات اللي فشلت، والزمن لكل مرحلة.

## خطة التقييم

التقييم هو اللي بيثبت للحكام إن الـ RAG بيرجّع المصدر الصح ومبيخترعش؛ وبيتعمل على golden set تبنيه إنت بإيدك من المصادر، مش من الـ LLM.

### الـ Golden set

من 36 لـ 48 حالة (9 conditions + unknown\_anomaly × 3 أو 4 variants). كل حالة = ملف JSON بنفس شكل الـ contract، والـ chunk\_ids المتوقعة (ومعاها بدائل مقبولة)، والـ `status` المتوقع. الـ variants:

1. قراءات نموذجية للحالة (label = 1 مع flag واضح).
2. قراءات حدّية قريبة من الحد (مرة label = 0 ومرة label = 1).
3. label = 1 من غير أي rule (`unknown_anomaly`).
4. حالة خارج النطاق أو من غير بروتوكول، والمتوقع فيها `no_protocol_found`.
5. حالات طبيعية (label = 0 ومفيش rule)، والمتوقع فيها `skipped`.

نفس الملفات هي الـ mock لخرج الـ ML (`tests/fixtures/ml_payloads/`)، فتشتغل على الـ RAG من غير ما تستنى زميلك.

### المقاييس

الأهداف دي مقترحة مني كنقطة بداية، مش أرقام مؤكدة:

| المقياس | بيقيس إيه | الهدف المقترح |
| --- | --- | --- |
| Recall@5 | الـ chunk الصح ضمن أول 5 نتايج | ≥ 0.90 |
| MRR | ترتيب الـ chunk الصح | ≥ 0.70 |
| دقة `no_protocol_found` | رفض الحالات الخارجة عن النطاق | ≥ 0.90 مع رفض غلط ≤ 0.10 |
| Citation validity | نسبة الخطوات اللي `source_chunk_id` بتاعها موجود فعلاً | 100% |
| Faithfulness | نسبة الخطوات المدعومة بنص الـ chunk (RAGAS + مراجعة يدوية لعينة) | ≥ 0.95 |
| Severity preservation | الـ severity ما اتنزّلتش | 100% |
| Latency p50 وp95 | زمن الاسترجاع والتوليد لكل severity | داخل ميزانية الزمن |
| Fallback correctness | الـ extractive بيشتغل والـ LLM واقف | 100% |

### تجارب المقارنة (Ablation)

دي أقوى حاجة تعرضها للحكام لأنها بتبرّر كل قرار في التصميم بأرقام من الـ golden set بتاعك:

- **الاسترجاع:** dense بس، وBM25 بس، وhybrid، وhybrid + reranker، وhybrid + reranker + metadata filter. القياس: Recall@5 وMRR.
- **الموديل:** Llama 3.1 8B مقابل Qwen2.5 7B. القياس: Faithfulness وCitation validity وزمن الاستجابة.
- **الـ Guardrail:** الرد مع الفحوصات ومن غيرها. القياس: عدد الخطوات اللي شالتها الفحوصات.

### الاختبارات الآلية

- Unit tests: الـ chunker والـ schemas وفحوصات الـ validation.
- Contract tests على الـ endpoint-ين بـ payloads من الـ mock.
- أمر `make eval` بيشغّل الـ golden set ويطلّع `eval_report.md` فيه الجداول، ويتشغّل بعد أي تغيير في الـ chunking أو العتبات.

## الـ Stack وهيكل المشروع

كل مكوّن في الـ stack بيشتغل محلياً بعد التنزيل الأول، والخدمة كلها بتتشغّل بأمر `docker compose up`.

| الطبقة | الاختيار |
| --- | --- |
| الـ API | FastAPI + Uvicorn + Pydantic v2 |
| استخراج الـ PDF | PyMuPDF (وocrmypdf للملفات المصوّرة) |
| الـ Embeddings | sentence-transformers مع `BAAI/bge-base-en-v1.5` |
| الـ Vector DB | ChromaDB (persistent) |
| البحث النصي | rank\_bm25 |
| الـ Reranker | `BAAI/bge-reranker-base` (CrossEncoder) |
| الـ LLM | Ollama مع Llama 3.1 8B أو Qwen2.5 7B |
| التقييم | RAGAS + سكريبتات الـ golden set |
| التغليف | Docker + docker compose (خدمتين: `rag-api` و`ollama`) |
| الإعدادات | `pydantic-settings` + ملف `.env` |

### هيكل المشروع

```text
rag-service/
├── data/
│   ├── raw/                  # downloaded PDFs
│   ├── processed/            # cleaned text, chunks.jsonl
│   └── sources.yaml
├── index/                    # chroma/, bm25.pkl, index_manifest.json
├── taxonomy/conditions.yaml  # also under shared/contracts if the Backend needs it
├── ingestion/
│   ├── extract.py  clean.py  chunk.py  tag.py
│   └── embed.py    build_index.py
├── app/
│   ├── main.py               # FastAPI app, lifespan loads the index
│   ├── config.py   schemas.py   audit.py
│   ├── api/       retrieve.py  generate.py  health.py
│   ├── retrieval/ query_builder.py  hybrid.py  rerank.py  gate.py
│   ├── generation/ prompt.py  ollama_client.py  extractive.py
│   └── validation/ checks.py
├── eval/
│   ├── golden/*.json
│   └── run_eval.py
├── tests/fixtures/ml_payloads/
├── docker/ Dockerfile  docker-compose.yml
├── Makefile
└── README.md
```

### التشغيل

```bash
make ingest     # raw PDFs -> chunks -> index/
make serve      # uvicorn app.main:app
make eval       # golden set -> eval_report.md
docker compose up --build
```

عشان تضمن إن الخدمة أوفلاين فعلاً: نزّل الموديلات مرة واحدة (`ollama pull` وكاش Hugging Face)، وبعدها شغّل الخدمة بـ `HF_HUB_OFFLINE=1` وجرّبها من غير إنترنت قبل العرض.

ملف `taxonomy/conditions.yaml` هو المصدر الوحيد لأسماء الـ conditions؛ الـ enum في Pydantic بيتولّد منه. زميلك مش محتاجه حالياً لأن الموديل بيطلّع label بس.

## الأمان والخصوصية والترخيص

النظام "Decision Support" مش بديل للطبيب، والحدود دي بتتقال بصراحة في الرد وفي العرض.

- **التصعيد:** أي حالة Critical بترجع بـ `escalation.required = true` وسطر تصعيد لجراح الرحلة، وده بيتضاف برمجياً مش من الـ LLM.
- **الإخلاء:** كل رد فيه حقل `disclaimer`، وشريحة "Limitations" في العرض.
- **الخصوصية:** `astronaut_id` معرّف مستعار (مثل A-03) مش اسم حقيقي، والـ audit log محلي ومفيهوش نصوص حرة بأسماء.
- **الأوفلاين:** الخدمة ما بتعملش أي نداء خارجي، والقراءات مبتتبعتش لأي API سحابي.
- **الوصول:** الـ Backend بينادي الخدمة بـ `X-API-Key`، والخدمة على شبكة docker الداخلية بس.
- **الـ Prompt injection:** نصوص الـ chunks بتتعامل كبيانات جوه tags، والـ system prompt والـ validation بيمسكوا أي خطوة مش مدعومة بالمصدر.
- **الترخيص:** سجلات NTRS اللي شفتها بتذكر Public وPublic Use Permitted، لكن لازم تتأكد من بيان الـ distribution لكل ملف قبل ما تعتمد عليه أو تعيد نشره، وتسجّل ده في `sources.yaml`.
- **الصراحة مع الحكام:** مصادر الإجراءات من حقبة الشاتل لو ما لقيتش الـ ISS Checklist، وبيانات الـ ML اللي هتتدرّب عليها مش بيانات رواد فضاء، والنظام مش متحقق منه إكلينيكياً.

## أسئلة مفتوحة

دي الأسئلة اللي إجاباتها بتغيّر في التصميم، ويفضل تتقفل بكرة في أول ساعتين:

- [ ] "الاتنين API" يقصد بيها endpoint الاسترجاع + endpoint التوليد، ولا API الـ ML + API الـ RAG؟
- [ ] هل في موديل Classification جاي (condition وseverity) بعد الـ Anomaly Detection؟ لو آه، الـ contract يتوسّع بيهم والـ LLM يفضل مكمّل مش بديل.
- [ ] معنى `confidence_score`: ثقة في الـ label المتوقع (زي ما الدليل بيقول) ولا احتمال الشذوذ؟ وإيه عتبة الثقة المنخفضة لـ label = 0؟
- [ ] الـ Backend هيبعت `window_count`؟ وإيه اللي بيحصل في أول 12 قراءة قبل ما النافذة تتملي؟
- [ ] حدود الـ Rules (Warning وCritical) هتتاخد من أنهي مصدر طبي، ومين بيراجعها؟
- [ ] مين بيطلّع تنبيه الـ Critical فوراً في الـ Backend: label = 1 بس، ولا الـ rules كمان؟
- [ ] إيه الملفات اللي التحدي بيوفرها في تاب Resources، وهل فيها ISS Medical Checklist؟
- [ ] جهاز التشغيل: الـ VRAM الفعلي وأسماء الـ tags للموديلات على Ollama (MedGemma 4B هو المرشح الأول).
- [ ] الخطوات بالإنجليزي بس، ولا الـ Backend محتاج ترجمة عربية؟
- [ ] الـ Backend هيستنى الرد الكامل، ولا هيستخدم endpoint الاسترجاع الأول للحالات الـ Critical؟
