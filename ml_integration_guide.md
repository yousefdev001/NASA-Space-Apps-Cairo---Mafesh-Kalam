# دليل تكامل نموذج تعلم الآلة (ML Integration Guide)

هذا الدليل مخصص لمطوري الويب والموبايل لتوضيح كيفية إعداد البيانات وإرسالها إلى نموذج الذكاء الاصطناعي (Model) واستلام النتائج.

---

## 1. شرح أعمدة المدخلات (Columns/Features Explanation)

تنقسم المدخلات المطلوبة إلى قسمين أساسيين:

### أ. مؤشرات المستشعرات اللحظية (Real-Time Metrics)
وهي البيانات الحالية التي تقرأ مباشرة من الأجهزة القابلة للارتداء (Wearables):

| اسم العمود في الـ JSON | الوصف العربي | نوع البيانات | مثال على القيمة |
| :--- | :--- | :--- | :--- |
| `heart_rate_bpm` | معدل نبضات القلب في الدقيقة | عشري (Float) | `59.7` |
| `hrv_rmssd_ms` | تقلب ضربات القلب (مؤشر ضغط الجسم) | عشري (Float) | `52.8` |
| `spo2_percent` | نسبة تشبع الأكسجين في الدم (%) | عشري (Float) | `98.3` |
| `body_temperature_c` | درجة حرارة الجسم بالدرجة المئوية | عشري (Float) | `36.85` |
| `respiratory_rate_bpm` | معدل التنفس (مرات الشهيق/الزفير بالدقيقة) | عشري (Float) | `12.5` |
| `systolic_bp_mmhg` | ضغط الدم الانقباضي | عشري (Float) | `109.5` |
| `diastolic_bp_mmhg` | ضغط الدم الانبساطي | عشري (Float) | `76.4` |

### ب. المؤشرات الحسابية لآخر ساعة (Rolling Features)
مؤشرات يتم حسابها برمجياً قبل إرسال الطلب للموديل بناءً على نافذة زمنية متحركة قدرها **60 دقيقة** (أي آخر 12 قراءة إذا كان التحديث كل 5 دقائق):

| اسم العمود في الـ JSON | الوصف العربي | نوع البيانات | مثال |
| :--- | :--- | :--- | :--- |
| `heart_rate_bpm_rolling_mean_60min` | متوسط نبضات القلب لآخر ساعة | عشري (Float) | `58.05` |
| `heart_rate_bpm_rolling_std_60min` | الانحراف المعياري للنبض لآخر ساعة | عشري (Float) | `2.33` |
| `hrv_rmssd_ms_rolling_mean_60min` | متوسط تقلب النبض لآخر ساعة | عشري (Float) | `57.60` |
| `hrv_rmssd_ms_rolling_std_60min` | الانحراف المعياري لتقلب النبض لآخر ساعة | عشري (Float) | `6.78` |
| `spo2_percent_rolling_mean_60min` | متوسط نسبة الأكسجين لآخر ساعة | عشري (Float) | `98.35` |
| `spo2_percent_rolling_std_60min` | الانحراف المعياري للأكسجين لآخر ساعة | عشري (Float) | `0.07` |
| `body_temperature_c_rolling_mean_60min` | متوسط درجة الحرارة لآخر ساعة | عشري (Float) | `36.81` |
| `body_temperature_c_rolling_std_60min` | الانحراف المعياري للحرارة لآخر ساعة | عشري (Float) | `0.04` |
| `respiratory_rate_bpm_rolling_mean_60min` | متوسط معدل التنفس لآخر ساعة | عشري (Float) | `14.05` |
| `respiratory_rate_bpm_rolling_std_60min` | الانحراف المعياري للتنفس لآخر ساعة | عشري (Float) | `2.19` |

---

## 2. كيفية حساب الـ Rolling Features وطريقتها بالتفصيل

تعتمد هذه الميزات على **نافذة زمنية متحركة (Sliding Window)** قيمتها ساعة واحدة. لحسابها:

### 1. المتوسط الحسابي المتحرك (Rolling Mean):
* **الهدف:** معرفة المعدل العام للمؤشر الحيوي وتخفيف حدة القفزات المفاجئة وغير الحقيقية.
* **طريقة الحساب:** اجمع قيم المؤشر الحيوي خلال آخر 60 دقيقة واقسمها على عدد القراءات.
  $$\text{Rolling Mean} = \frac{\sum_{i=1}^{N} X_i}{N}$$

### 2. الانحراف المعياري المتحرك (Rolling Standard Deviation):
* **الهدف:** يقيس مدى تشتت أو استقرار البيانات خلال الساعة الماضية. القيمة المنخفضة تعني استقراراً، بينما الارتفاع المفاجئ يعني تقلبات حادة قد تشير لتوتر أو خلل.
* **طريقة الحساب:** يقيس مدى ابتعاد القراءات الفردية عن المتوسط الحسابي الذي تم حسابه:
  $$\text{Rolling Std} = \sqrt{\frac{\sum_{i=1}^{N} (X_i - \text{Rolling Mean})^2}{N-1}}$$

---

## 3. شكل الـ JSON المتوقع إرساله للموديل (Request Payload)

يجب على مطور الويب/الموبايل إرسال هذا الـ Object بدقة:

```json
{
  "heart_rate_bpm": 59.7,
  "hrv_rmssd_ms": 52.8,
  "spo2_percent": 98.3,
  "body_temperature_c": 36.85,
  "respiratory_rate_bpm": 12.5,
  "systolic_bp_mmhg": 109.5,
  "diastolic_bp_mmhg": 76.4,
  "heart_rate_bpm_rolling_mean_60min": 59.7,
  "heart_rate_bpm_rolling_std_60min": 0.0,
  "hrv_rmssd_ms_rolling_mean_60min": 52.8,
  "hrv_rmssd_ms_rolling_std_60min": 0.0,
  "spo2_percent_rolling_mean_60min": 98.3,
  "spo2_percent_rolling_std_60min": 0.0,
  "body_temperature_c_rolling_mean_60min": 36.85,
  "body_temperature_c_rolling_std_60min": 0.0,
  "respiratory_rate_bpm_rolling_mean_60min": 12.5,
  "respiratory_rate_bpm_rolling_std_60min": 0.0
}
```

---

## 4. المخرجات النهائية للنموذج (Output API Response)

عند استدعاء الموديل، يستجيب بالنتيجة التالية فوراً:

```json
{
  "anomaly_label": 0,
  "confidence_score": 0.942
}
```

* **`anomaly_label`**: 
  * `0`: الحالة طبيعية ومستقرة تماماً.
  * `1`: تم رصد حالة غير طبيعية (Anomaly) تستوجب التنبيه الفوري.
* **`confidence_score`**: درجة دقة أو ثقة النموذج في قراره الحالي وتتراوح من `0.0` إلى `1.0`.
