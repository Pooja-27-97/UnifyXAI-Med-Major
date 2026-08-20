import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, FlaskConical, Loader2 } from "lucide-react";
import Layout from "../components/Layout.jsx";
import { useApp } from "../context/AppContext.jsx";
import { DEFAULT_PATIENT, runFullPipeline } from "../data/mockEngine.js";

const MODEL_FIELDS = [
  {
    key: "HighBP",
    label: "High Blood Pressure",
    description: "Has the patient been told they have high blood pressure?",
  },
  {
    key: "HighChol",
    label: "High Cholesterol",
    description: "Has the patient been told they have high cholesterol?",
  },
  {
    key: "CholCheck",
    label: "Cholesterol Check",
    description: "Has the patient had their cholesterol checked?",
  },
  {
    key: "BMI",
    label: "BMI",
    description: "Body Mass Index",
    type: "number",
    min: 10,
    max: 70,
    step: 0.1,
  },
  {
    key: "Smoker",
    label: "Smoker",
    description: "Has the patient smoked at least 100 cigarettes in their lifetime?",
  },
  {
    key: "Stroke",
    label: "History of Stroke",
    description: "Has the patient ever had a stroke?",
  },
  {
    key: "HeartDiseaseorAttack",
    label: "Heart Disease or Heart Attack",
    description: "History of coronary heart disease or myocardial infarction?",
  },
  {
    key: "PhysActivity",
    label: "Physical Activity",
    description: "Any physical activity in the past 30 days?",
  },
  {
    key: "Fruits",
    label: "Fruit Consumption",
    description: "Consumes fruit at least once per day?",
  },
  {
    key: "Veggies",
    label: "Vegetable Consumption",
    description: "Consumes vegetables at least once per day?",
  },
  {
    key: "HvyAlcoholConsump",
    label: "Heavy Alcohol Consumption",
    description: "Heavy alcohol consumption?",
  },
  {
    key: "AnyHealthcare",
    label: "Healthcare Coverage",
    description: "Has some form of healthcare coverage?",
  },
  {
    key: "NoDocbcCost",
    label: "Unable to See Doctor Due to Cost",
    description: "Was there a time medical care was needed but could not be obtained due to cost?",
  },
  {
    key: "GenHlth",
    label: "General Health",
    description: "Overall general health",
    type: "select",
    options: [
      { value: 1, label: "Excellent" },
      { value: 2, label: "Very Good" },
      { value: 3, label: "Good" },
      { value: 4, label: "Fair" },
      { value: 5, label: "Poor" },
    ],
  },
  {
    key: "MentHlth",
    label: "Mental Health",
    description: "Days of poor mental health during the past 30 days",
    type: "number",
    min: 0,
    max: 30,
    step: 1,
  },
  {
    key: "PhysHlth",
    label: "Physical Health",
    description: "Days of poor physical health during the past 30 days",
    type: "number",
    min: 0,
    max: 30,
    step: 1,
  },
  {
    key: "DiffWalk",
    label: "Difficulty Walking",
    description: "Difficulty walking or climbing stairs?",
  },
  {
    key: "Sex",
    label: "Sex",
    description: "Sex recorded in the dataset",
    type: "select",
    options: [
      { value: 0, label: "Female" },
      { value: 1, label: "Male" },
    ],
  },
  {
    key: "Age",
    label: "Age Group",
    description: "Age category used by the dataset",
    type: "select",
    options: [
      { value: 1, label: "18–24" },
      { value: 2, label: "25–29" },
      { value: 3, label: "30–34" },
      { value: 4, label: "35–39" },
      { value: 5, label: "40–44" },
      { value: 6, label: "45–49" },
      { value: 7, label: "50–54" },
      { value: 8, label: "55–59" },
      { value: 9, label: "60–64" },
      { value: 10, label: "65–69" },
      { value: 11, label: "70–74" },
      { value: 12, label: "75–79" },
      { value: 13, label: "80+" },
    ],
  },
  {
    key: "Education",
    label: "Education Level",
    description: "Education category used by the dataset",
    type: "select",
    options: [
      { value: 1, label: "Never attended school" },
      { value: 2, label: "Elementary school" },
      { value: 3, label: "Some high school" },
      { value: 4, label: "High school graduate" },
      { value: 5, label: "Some college or technical school" },
      { value: 6, label: "College graduate" },
    ],
  },
  {
    key: "Income",
    label: "Income Level",
    description: "Income category used by the dataset",
    type: "select",
    options: [
      { value: 1, label: "Lowest income category" },
      { value: 2, label: "Income category 2" },
      { value: 3, label: "Income category 3" },
      { value: 4, label: "Income category 4" },
      { value: 5, label: "Income category 5" },
      { value: 6, label: "Income category 6" },
      { value: 7, label: "Income category 7" },
      { value: 8, label: "Highest income category" },
    ],
  },
];

export default function NewPrediction() {
  const [patient, setPatient] = useState(DEFAULT_PATIENT);
  const [loading, setLoading] = useState(false);
  const { addPrediction } = useApp();
  const navigate = useNavigate();

  function update(key, value) {
    setPatient((p) => ({ ...p, [key]: value }));
  }

  function handleReset() {
    setPatient(DEFAULT_PATIENT);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const normalized = { ...patient };

    MODEL_FIELDS.forEach((field) => {
      if (field.type === "number") {
        normalized[field.key] = Number(patient[field.key]) || 0;
      } else if (field.type === "select") {
        normalized[field.key] = Number(patient[field.key]);
      } else {
        normalized[field.key] = Number(patient[field.key]) || 0;
      }
    });
    // Simulated inference latency for the RF + SHAP + LIME + Unification pipeline.
    setTimeout(() => {
      const record = runFullPipeline(normalized);
      addPrediction(record);
      setLoading(false);
      navigate("/result");
    }, 900);
  }

  return (
    <Layout eyebrow="New Prediction" title="Patient Intake & Risk Prediction">
      <form onSubmit={handleSubmit}>

        {/* Patient Identification */}
        <div className="card card-pad">
          <div className="card-head">
            <div>
              <h3>Patient Identification</h3>
              <p>Used for report labeling only — not sent to the model.</p>
            </div>
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
            }}
          >
            <div className="field">
              <label htmlFor="name">Patient Name</label>
              <input
                id="name"
                className="input"
                placeholder="e.g. Anjali Mehta"
                value={patient.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="pid">Patient ID</label>
              <input
                id="pid"
                className="input"
                placeholder="e.g. PT-10234"
                value={patient.patientId}
                onChange={(e) => update("patientId", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="Sex">Sex</label>
              <select
                id="Sex"
                className="select"
                value={patient.Sex}
                onChange={(e) =>
                  update("Sex", Number(e.target.value))
                }
              >
                <option value={0}>Female</option>
                <option value={1}>Male</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="Age">Age Group</label>
              <select
                id="Age"
                className="select"
                value={patient.Age}
                onChange={(e) =>
                  update("Age", Number(e.target.value))
                }
              >
                <option value={1}>18–24</option>
                <option value={2}>25–29</option>
                <option value={3}>30–34</option>
                <option value={4}>35–39</option>
                <option value={5}>40–44</option>
                <option value={6}>45–49</option>
                <option value={7}>50–54</option>
                <option value={8}>55–59</option>
                <option value={9}>60–64</option>
                <option value={10}>65–69</option>
                <option value={11}>70–74</option>
                <option value={12}>75–79</option>
                <option value={13}>80+</option>
              </select>
            </div>
          </div>
        </div>


        {/* Main Model Inputs */}
        <div
          className="grid grid-2"
          style={{
            alignItems: "start",
            marginTop: 18,
            gap: 18,
          }}
        >

          {/* Left Column */}
          <div>

            {/* Health Conditions */}
            <div className="card card-pad">
              <div className="card-head">
                <div>
                  <h3>Health Conditions</h3>
                  <p>Existing medical conditions and checks</p>
                </div>
              </div>

              <FormSection title="">
                <BooleanField
                  label="High Blood Pressure"
                  value={patient.HighBP}
                  onChange={(value) => update("HighBP", value)}
                />

                <BooleanField
                  label="High Cholesterol"
                  value={patient.HighChol}
                  onChange={(value) => update("HighChol", value)}
                />

                <BooleanField
                  label="Cholesterol Check"
                  value={patient.CholCheck}
                  onChange={(value) => update("CholCheck", value)}
                />

                <BooleanField
                  label="History of Stroke"
                  value={patient.Stroke}
                  onChange={(value) => update("Stroke", value)}
                />

                <BooleanField
                  label="Heart Disease or Heart Attack"
                  value={patient.HeartDiseaseorAttack}
                  onChange={(value) =>
                    update("HeartDiseaseorAttack", value)
                  }
                />

                <div className="field">
                  <label htmlFor="BMI">BMI</label>
                  <input
                    id="BMI"
                    type="number"
                    className="input"
                    value={patient.BMI ?? 25}
                    min={10}
                    max={70}
                    step={0.1}
                    onChange={(e) =>
                      update("BMI", Number(e.target.value))
                    }
                  />
                  <span className="hint">kg/m²</span>
                </div>
              </FormSection>
            </div>


            {/* General Health */}
            <div className="card card-pad" style={{ marginTop: 18 }}>
              <div className="card-head">
                <div>
                  <h3>General Health</h3>
                  <p>Recent physical and mental health information</p>
                </div>
              </div>

              <FormSection title="">
                <div className="field">
                  <label htmlFor="GenHlth">General Health</label>
                  <select
                    id="GenHlth"
                    className="select"
                    value={patient.GenHlth ?? 3}
                    onChange={(e) =>
                      update("GenHlth", Number(e.target.value))
                    }
                  >
                    <option value={1}>Excellent</option>
                    <option value={2}>Very Good</option>
                    <option value={3}>Good</option>
                    <option value={4}>Fair</option>
                    <option value={5}>Poor</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="MentHlth">
                    Poor Mental Health Days
                  </label>
                  <input
                    id="MentHlth"
                    type="number"
                    className="input"
                    value={patient.MentHlth ?? 0}
                    min={0}
                    max={30}
                    step={1}
                    onChange={(e) =>
                      update("MentHlth", Number(e.target.value))
                    }
                  />
                  <span className="hint">
                    Days during the past 30 days
                  </span>
                </div>

                <div className="field">
                  <label htmlFor="PhysHlth">
                    Poor Physical Health Days
                  </label>
                  <input
                    id="PhysHlth"
                    type="number"
                    className="input"
                    value={patient.PhysHlth ?? 0}
                    min={0}
                    max={30}
                    step={1}
                    onChange={(e) =>
                      update("PhysHlth", Number(e.target.value))
                    }
                  />
                  <span className="hint">
                    Days during the past 30 days
                  </span>
                </div>

                <BooleanField
                  label="Difficulty Walking"
                  value={patient.DiffWalk}
                  onChange={(value) => update("DiffWalk", value)}
                />
              </FormSection>
            </div>

          </div>


          {/* Right Column */}
          <div>

            {/* Lifestyle */}
            <div className="card card-pad">
              <div className="card-head">
                <div>
                  <h3>Lifestyle</h3>
                  <p>Daily habits and activity information</p>
                </div>
              </div>

              <FormSection title="">
                <BooleanField
                  label="Smoker"
                  value={patient.Smoker}
                  onChange={(value) => update("Smoker", value)}
                />

                <BooleanField
                  label="Physical Activity"
                  value={patient.PhysActivity}
                  onChange={(value) =>
                    update("PhysActivity", value)
                  }
                />

                <BooleanField
                  label="Fruit Consumption"
                  value={patient.Fruits}
                  onChange={(value) =>
                    update("Fruits", value)
                  }
                />

                <BooleanField
                  label="Vegetable Consumption"
                  value={patient.Veggies}
                  onChange={(value) =>
                    update("Veggies", value)
                  }
                />

                <BooleanField
                  label="Heavy Alcohol Consumption"
                  value={patient.HvyAlcoholConsump}
                  onChange={(value) =>
                    update("HvyAlcoholConsump", value)
                  }
                />
              </FormSection>
            </div>


            {/* Healthcare & Demographics */}
            <div className="card card-pad" style={{ marginTop: 18 }}>
              <div className="card-head">
                <div>
                  <h3>Healthcare & Demographics</h3>
                  <p>Healthcare access and socioeconomic information</p>
                </div>
              </div>

              <FormSection title="Healthcare Access">
                <BooleanField
                  label="Healthcare Coverage"
                  value={patient.AnyHealthcare}
                  onChange={(value) =>
                    update("AnyHealthcare", value)
                  }
                />

                <BooleanField
                  label="Unable to See Doctor Due to Cost"
                  value={patient.NoDocbcCost}
                  onChange={(value) =>
                    update("NoDocbcCost", value)
                  }
                />
              </FormSection>

              <FormSection title="Demographics">
                <div className="field">
                  <label htmlFor="Education">
                    Education Level
                  </label>

                  <select
                    id="Education"
                    className="select"
                    value={patient.Education ?? 4}
                    onChange={(e) =>
                      update(
                        "Education",
                        Number(e.target.value)
                      )
                    }
                  >
                    <option value={1}>
                      Never attended school
                    </option>
                    <option value={2}>
                      Elementary school
                    </option>
                    <option value={3}>
                      Some high school
                    </option>
                    <option value={4}>
                      High school graduate
                    </option>
                    <option value={5}>
                      Some college or technical school
                    </option>
                    <option value={6}>
                      College graduate
                    </option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="Income">
                    Income Level
                  </label>

                  <select
                    id="Income"
                    className="select"
                    value={patient.Income ?? 4}
                    onChange={(e) =>
                      update(
                        "Income",
                        Number(e.target.value)
                      )
                    }
                  >
                    <option value={1}>
                      Lowest income category
                    </option>
                    <option value={2}>
                      Income category 2
                    </option>
                    <option value={3}>
                      Income category 3
                    </option>
                    <option value={4}>
                      Income category 4
                    </option>
                    <option value={5}>
                      Income category 5
                    </option>
                    <option value={6}>
                      Income category 6
                    </option>
                    <option value={7}>
                      Income category 7
                    </option>
                    <option value={8}>
                      Highest income category
                    </option>
                  </select>
                </div>
              </FormSection>
            </div>

          </div>
        </div>


        {/* Submit Bar */}
        <div
          className="card card-pad"
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <p
            style={{
              fontSize: 12.5,
              color: "var(--muted)",
              maxWidth: 520,
            }}
          >
            Enter the patient's health and lifestyle information
            to generate a diabetes prediction and an
            explainability report.
          </p>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
            >
              <RotateCcw size={15} />
              Reset
            </button>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="mono"
                  style={{
                    animation: "spin 1s linear infinite",
                  }}
                />
              ) : (
                <FlaskConical size={16} />
              )}

              {loading
                ? "Running pipeline…"
                : "Predict"}
            </button>
          </div>
        </div>

      </form>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Layout>
  );
}

function FormSection({ title, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      {title && (
        <h4
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--muted)",
            marginBottom: 12,
          }}
        >
          {title}
        </h4>
      )}

      <div
        className="grid grid-2"
        style={{ gap: 14 }}
      >
        {children}
      </div>
    </div>
  );
}

function BooleanField({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>

      <select
        className="select"
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value={0}>No</option>
        <option value={1}>Yes</option>
      </select>
    </div>
  );
}