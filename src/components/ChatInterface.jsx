import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  Languages,
  CheckCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

const CHAT_STATE = {
  AWAITING_SYMPTOMS: 'AWAITING_SYMPTOMS',
  ANALYZING_SYMPTOMS: 'ANALYZING_SYMPTOMS',
  AWAITING_NAME: 'AWAITING_NAME',
  AWAITING_AGE: 'AWAITING_AGE',
  AWAITING_GENDER: 'AWAITING_GENDER',
  AWAITING_MOBILE: 'AWAITING_MOBILE',
  AWAITING_CONGESTION_DECISION: 'AWAITING_CONGESTION_DECISION',
  COMPLETED: 'COMPLETED'
};

const getLocalizedMessageText = (type, lang, params = {}) => {
  switch (type) {
    case 'WELCOME':
      return lang === 'EN' 
        ? "Welcome to KGMU AI Triage. 🏥\n\nI am the KGMU Emergency Assistant. Please describe your symptoms in detail so I can determine your triage level.\n\nYou can type your symptoms, use the quick buttons below, or hold the mic 🎙️ to send a voice note."
        : "KGMU AI ट्राइएज में आपका स्वागत है। 🏥\n\nमैं KGMU आपातकालीन सहायक हूँ। कृपया अपने लक्षणों का विस्तार से वर्णन करें ताकि मैं आपकी आपातकालीन गंभीरता (Triage Level) निर्धारित कर सकूं।\n\nआप नीचे दिए गए बटनों का उपयोग कर सकते हैं, टाइप कर सकते हैं, या वॉयस नोट भेजने के लिए माइक 🎙️ बटन दबा सकते हैं।";
        
    case 'ANALYZING_SYMPTOMS':
      return lang === 'EN'
        ? "🔍 *AI Agent:* Parsing symptoms for clinical indicators..."
        : "🔍 *AI Agent:* नैदानिक लक्षणों के लिए जांच की जा रही है...";
        
    case 'ACUITY_DETECTION':
      return params.isCritical
        ? (lang === 'EN'
            ? "🚨 *AI Agent:* Severe cardiovascular indicators detected. Triage severity level 5."
            : "🚨 *AI Agent:* गंभीर हृदय रोग लक्षण मिले हैं। ट्राइएज स्तर 5 (अति गंभीर)।")
        : (lang === 'EN'
            ? "🟢 *AI Agent:* General outpatient symptoms detected. Triage severity level 2-3."
            : "🟢 *AI Agent:* सामान्य ओपीडी रोग लक्षण मिले हैं। ट्राइएज स्तर 2-3 (सामान्य)।");
            
    case 'ASK_NAME':
      return lang === 'EN'
        ? "To create your triage record and book your appointment, please enter your **Full Name**:"
        : "ट्राइएज रिकॉर्ड और पंजीकरण बनाने के लिए, कृपया अपना **पूरा नाम** दर्ज करें:";
        
    case 'ASK_AGE':
      return lang === 'EN'
        ? `Thank you, ${params.name}. What is your **Age** (in years)?`
        : `धन्यवाद, ${params.name}। आपकी **उम्र** क्या है (वर्षों में)?`;
        
    case 'ASK_GENDER':
      return lang === 'EN'
        ? "What is your **Gender**? (Male / Female / Other)"
        : "आपका **लिंग** क्या है? (पुरुष / महिला / अन्य)";
        
    case 'ASK_MOBILE':
      return lang === 'EN'
        ? "Please enter your **10-digit Mobile Number** for appointment verification and SMS updates:"
        : "सत्यापन और SMS अपडेट के लिए कृपया अपना **10-अंकीय मोबाइल नंबर** दर्ज करें:";
        
    case 'CRITICAL_CONFIRM':
      return lang === 'EN'
        ? `Processing emergency registration... Account generated for ${params.name}.\n\nPatient ID: ${params.patientId}\nRecommended: Lari Cardiology Emergency`
        : `आपातकालीन पंजीकरण किया जा रहा है... ${params.name} के लिए खाता तैयार।\n\nरोगी आईडी: ${params.patientId}\nसुझाव: लारी कार्डियोलॉजी इमरजेंसी`;
        
    case 'CRITICAL_BYPASS':
      return lang === 'EN'
        ? `🚨 CRITICAL CARDIOVASCULAR EMERGENCY. Proceed immediately to Lari Cardiology Emergency. Your queue number has been bypassed. Show this screen at the gate.`
        : `🚨 गंभीर हृदय आपातकाल। तुरंत लारी कार्डियोलॉजी इमरजेंसी (Lari Cardiology Emergency) में जाएं। आपका नंबर बाईपास कर दिया गया है। गेट पर यह स्क्रीन दिखाएं।`;
        
    case 'CONGESTION_PROMPT':
      return lang === 'EN'
        ? `⚠️ *KGMU AI:* KGMU ${params.dept} is experiencing high congestion. Estimated wait time is **${params.wait} minutes**.\n\nLucknow Civil Hospital is operating at low load with a wait time of only **15 minutes**.\n\nWould you like me to redirect and register your slot at **Lucknow Civil Hospital** instead for faster treatment?`
        : `⚠️ *KGMU AI:* KGMU ${params.dept} में अत्यधिक भीड़ है। अनुमानित प्रतीक्षा समय **${params.wait} मिनट** है।\n\nलखनऊ सिविल अस्पताल में वर्तमान में प्रतीक्षा समय केवल **15 मिनट** है।\n\nक्या आप अपना ओपीडी स्लॉट **लखनऊ सिविल अस्पताल** में पुनर्निर्देशित और पंजीकृत करना चाहेंगे?`;
        
    case 'NORMAL_CONFIRM':
      return lang === 'EN'
        ? `Appointment registered successfully for ${params.name}.\n\nPatient ID: ${params.patientId}\nRecommended Department: ${params.dept} OPD\nTriage Level: ${params.severity}\nEstimated wait: ${params.wait} mins.\n\nVerification SMS ticket sent to ${params.mobile}.`
        : `पंजीकरण पूरा हुआ, ${params.name}।\n\nरोगी आईडी: ${params.patientId}\nअनुशंसित विभाग: KGMU ${params.dept === 'General Medicine' ? 'सामान्य चिकित्सा' : 'ट्रॉमा इमरजेंसी'} ओपीडी\nआपातकालीन स्तर: ${params.severity}\nअनुमानित प्रतीक्षा: ${params.wait} मिनट।\n\nSMS टिकट ${params.mobile} पर भेज दिया गया है।`;
        
    case 'CIVIL_CONFIRM':
      return lang === 'EN'
        ? `Slot registered successfully at Lucknow Civil Hospital General OPD.\n\nPatient ID: ${params.patientId}\nEstimated wait: 15 mins.\n\nAmbulance/transit load-balanced telemetry logged.`
        : `लखनऊ सिविल अस्पताल जनरल ओपीडी में स्लॉट सफलतापूर्वक पंजीकृत।\n\nरोगी आईडी: ${params.patientId}\nअनुमानित प्रतीक्षा: 15 मिनट।`;
        
    case 'KGMU_CONFIRM':
      return lang === 'EN'
        ? `Registered at KGMU.\n\nPatient ID: ${params.patientId}\nRecommended Department: ${params.dept} OPD\nTriage Level: ${params.severity}\nEstimated wait: ${params.wait} mins.`
        : `KGMU में पंजीकृत किया गया।\n\nरोगी आईडी: ${params.patientId}\nअनुशंसित विभाग: KGMU ${params.dept === 'General Medicine' ? 'सामान्य चिकित्सा' : 'ट्रॉमा इमरजेंसी'} ओपीडी\nअनुमानित प्रतीक्षा: ${params.wait} मिनट।`;

    case 'PRESET_CRITICAL':
      return lang === 'EN'
        ? 'I have intense chest pain, tightness, and sweating profusely. It radiates to my left arm.'
        : 'मुझे छाती में तेज दर्द, घुटन और बहुत पसीना आ रहा है। यह दर्द मेरे बाएं हाथ में फैल रहा है।';
        
    case 'PRESET_FEVER':
      return lang === 'EN'
        ? 'I have a mild fever (99.8 F), runny nose, and body ache since yesterday.'
        : 'मुझे कल से हल्का बुखार (99.8 F), बहती नाक और बदन दर्द है।';
        
    case 'PRESET_FRACTURE':
      return lang === 'EN'
        ? 'I fell down and twisted my ankle. It is swollen and hurts to walk, but no bleeding.'
        : 'मैं गिर गया और मेरे टखने में मोच आ गई। इसमें सूजन है और चलने में दर्द हो रहा है, लेकिन खून नहीं बह रहा।';

    case 'PRESET_DEMO_NAME':
      return lang === 'EN' ? 'Aditya Pandey' : 'आदित्य पाण्डेय';

    case 'PRESET_DEMO_GENDER':
      return lang === 'EN' ? 'Male' : 'Male';

    case 'PRESET_CONGESTION_CIVIL':
      return lang === 'EN' ? 'Route to Civil Hospital 🏢' : 'सिविल अस्पताल 🏢';

    case 'PRESET_CONGESTION_KGMU':
      return lang === 'EN' ? 'Continue at KGMU 🏥' : 'KGMU में ही रहें 🏥';

    default:
      return null;
  }
};

export default function ChatInterface({ language, setLanguage, onCriticalTriage, onNormalTriage, getEstimatedWait, queueData }) {
  const [currentState, setCurrentState] = useState(CHAT_STATE.AWAITING_SYMPTOMS);
  const [registeredPatientId, setRegisteredPatientId] = useState(null);
  const [isVoice, setIsVoice] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  // Patient details state accumulator
  const [tempPatientData, setTempPatientData] = useState({
    symptoms: '',
    name: '',
    age: '',
    gender: '',
    mobile: '',
    isCritical: false
  });

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      type: 'WELCOME',
      text: language === 'EN' 
        ? "Welcome to KGMU AI Triage. 🏥\n\nI am the KGMU Emergency Assistant. Please describe your symptoms in detail so I can determine your triage level.\n\nYou can type your symptoms, use the quick buttons below, or hold the mic 🎙️ to send a voice note."
        : "KGMU AI ट्राइएज में आपका स्वागत है। 🏥\n\nमैं KGMU आपातकालीन सहायक हूँ। कृपया अपने लक्षणों का विस्तार से वर्णन करें ताकि मैं आपकी आपातकालीन गंभीरता (Triage Level) निर्धारित कर सकूं।\n\nआप नीचे दिए गए बटनों का उपयोग कर सकते हैं, टाइप कर सकते हैं, या वॉयस नोट भेजने के लिए माइक 🎙️ बटन दबा सकते हैं।",
      timestamp: '20:16'
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const chatEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Symptoms translation annd keys
  const symptomPresets = [
    {
      id: 'critical',
      label: language === 'EN' ? 'Chest Pain & Sweating 🚨' : 'छाती में दर्द और पसीना 🚨',
      symptomsEn: 'I have intense chest pain, tightness, and sweating profusely. It radiates to my left arm.',
      symptomsHi: 'मुझे छाती में तेज दर्द, घुटन और बहुत पसीना आ रहा है। यह दर्द मेरे बाएं हाथ में फैल रहा है।'
    },
    {
      id: 'fever',
      label: language === 'EN' ? 'Mild Fever & Cold' : 'हल्का बुखार और जुकाम',
      symptomsEn: 'I have a mild fever (99.8 F), runny nose, and body ache since yesterday.',
      symptomsHi: 'मुझे कल से हल्का बुखार (99.8 F), बहती नाक और बदन दर्द है।'
    },
    {
      id: 'fracture',
      label: language === 'EN' ? 'Sprained Ankle' : 'पैर में मोच',
      symptomsEn: 'I fell down and twisted my ankle. It is swollen and hurts to walk, but no bleeding.',
      symptomsHi: 'मैं गिर गया और मेरे टखने में मोच आ गई। इसमें सूजन है और चलने में दर्द हो रहा है, लेकिन खून नहीं बह रहा।'
    }
  ];

  const handleSend = (textToSend, msgType = null) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    let finalType = msgType;
    if (!finalType) {
      if (messageText === symptomPresets[0].symptomsEn || messageText === symptomPresets[0].symptomsHi) {
        finalType = 'PRESET_CRITICAL';
      } else if (messageText === symptomPresets[1].symptomsEn || messageText === symptomPresets[1].symptomsHi) {
        finalType = 'PRESET_FEVER';
      } else if (messageText === symptomPresets[2].symptomsEn || messageText === symptomPresets[2].symptomsHi) {
        finalType = 'PRESET_FRACTURE';
      } else if (messageText === 'Aditya Pandey' || messageText === 'आदित्य पाण्डेय') {
        finalType = 'PRESET_DEMO_NAME';
      } else if (messageText === 'Male') {
        finalType = 'PRESET_DEMO_GENDER';
      } else if (messageText.includes('Civil Hospital') || messageText.includes('सिविल अस्पताल')) {
        finalType = 'PRESET_CONGESTION_CIVIL';
      } else if (messageText.includes('Continue at KGMU') || messageText.includes('KGMU में ही रहें')) {
        finalType = 'PRESET_CONGESTION_KGMU';
      }
    }

    // Add user message to UI
    const userMsg = {
      id: messages.length + 1,
      sender: 'user',
      type: finalType,
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      // State Machine Transition Logic
      if (currentState === CHAT_STATE.AWAITING_SYMPTOMS) {
        // Step 1: Detect Severity & Transition to analysis animation
        const lowerText = messageText.toLowerCase();
        const isCritical = lowerText.includes('chest pain') || 
                           lowerText.includes('sweating') || 
                           lowerText.includes('heart') || 
                           lowerText.includes('दर्द') || 
                           lowerText.includes('पसीना') || 
                           lowerText.includes('छाती');
        
        setTempPatientData(prev => ({
          ...prev,
          symptoms: messageText,
          isCritical: isCritical
        }));

        setCurrentState(CHAT_STATE.ANALYZING_SYMPTOMS);
        setIsTyping(true);

        setTimeout(() => {
          setMessages(prev => {
            const log1 = {
              id: prev.length + 1,
              sender: 'bot',
              type: 'ANALYZING_SYMPTOMS',
              text: language === 'EN' 
                ? "🔍 *AI Agent:* Parsing symptoms for clinical indicators..."
                : "🔍 *AI Agent:* नैदानिक लक्षणों के लिए जांच की जा रही है...",
              timestamp: timeStr
            };
            return [...prev, log1];
          });
          
          setTimeout(() => {
            setMessages(prev => {
              const log2 = {
                id: prev.length + 1,
                sender: 'bot',
                type: 'ACUITY_DETECTION',
                params: { isCritical },
                text: isCritical 
                  ? (language === 'EN' 
                      ? "🚨 *AI Agent:* Severe cardiovascular indicators detected. Triage severity level 5."
                      : "🚨 *AI Agent:* गंभीर हृदय रोग लक्षण मिले हैं। ट्राइएज स्तर 5 (अति गंभीर)।")
                  : (language === 'EN'
                      ? "🟢 *AI Agent:* General outpatient symptoms detected. Triage severity level 2-3."
                      : "🟢 *AI Agent:* सामान्य ओपीडी रोग लक्षण मिले हैं। ट्राइएज स्तर 2-3 (सामान्य)।"),
                timestamp: timeStr
              };
              return [...prev, log2];
            });
            
            setTimeout(() => {
              setMessages(prev => {
                const log3 = {
                  id: prev.length + 1,
                  sender: 'bot',
                  type: 'ASK_NAME',
                  text: language === 'EN'
                    ? "To create your triage record and book your appointment, please enter your **Full Name**:"
                    : "ट्राइएज रिकॉर्ड और पंजीकरण बनाने के लिए, कृपया अपना **पूरा नाम** दर्ज करें:",
                  timestamp: timeStr
                };
                return [...prev, log3];
              });
              setIsTyping(false);
              setCurrentState(CHAT_STATE.AWAITING_NAME);
            }, 850);
          }, 850);
        }, 650);

      } else if (currentState === CHAT_STATE.AWAITING_NAME) {
        // Step 2: Store Name & Ask for Age
        setTempPatientData(prev => ({
          ...prev,
          name: messageText
        }));

        setMessages(prev => {
          const botReply = {
            id: prev.length + 1,
            sender: 'bot',
            type: 'ASK_AGE',
            params: { name: messageText },
            text: language === 'EN'
              ? `Thank you, ${messageText}. What is your **Age** (in years)?`
              : `धन्यवाद, ${messageText}। आपकी **उम्र** क्या है (वर्षों में)?`,
            timestamp: timeStr
          };
          return [...prev, botReply];
        });
        setCurrentState(CHAT_STATE.AWAITING_AGE);

      } else if (currentState === CHAT_STATE.AWAITING_AGE) {
        // Step 3: Store Age & Ask for Gender
        setTempPatientData(prev => ({
          ...prev,
          age: messageText
        }));

        setMessages(prev => {
          const botReply = {
            id: prev.length + 1,
            sender: 'bot',
            type: 'ASK_GENDER',
            text: language === 'EN'
              ? "What is your **Gender**? (Male / Female / Other)"
              : "आपका **लिंग** क्या है? (पुरुष / महिला / अन्य)",
            timestamp: timeStr
          };
          return [...prev, botReply];
        });
        setCurrentState(CHAT_STATE.AWAITING_GENDER);

      } else if (currentState === CHAT_STATE.AWAITING_GENDER) {
        // Step 4: Store Gender & Ask for Mobile
        setTempPatientData(prev => ({
          ...prev,
          gender: messageText
        }));

        setMessages(prev => {
          const botReply = {
            id: prev.length + 1,
            sender: 'bot',
            type: 'ASK_MOBILE',
            text: language === 'EN'
              ? "Please enter your **10-digit Mobile Number** for appointment verification and SMS updates:"
              : "सत्यापन और SMS अपडेट के लिए कृपया अपना **10-अंकीय मोबाइल नंबर** दर्ज करें:",
            timestamp: timeStr
          };
          return [...prev, botReply];
        });
        setCurrentState(CHAT_STATE.AWAITING_MOBILE);

      } else if (currentState === CHAT_STATE.AWAITING_MOBILE) {
        // Step 5: Store Mobile & Determine Triage / Redirection
        const finalData = {
          ...tempPatientData,
          mobile: messageText
        };
        setTempPatientData(finalData);

        const patientId = `KGMU-${Math.floor(1000 + Math.random() * 9000)}`;

        if (finalData.isCritical) {
          // Critical Route
          const criticalPatient = {
            id: patientId,
            name: finalData.name,
            age: parseInt(finalData.age) || 54,
            gender: finalData.gender,
            mobile: finalData.mobile,
            symptoms: finalData.symptoms,
            department: 'Lari Cardiology',
            severity: 5,
            waitTime: 0,
            status: 'Bypassed ⚡',
            isVoice: isVoice
          };

          setMessages(prev => {
            const botReply = {
              id: prev.length + 1,
              sender: 'bot',
              type: 'CRITICAL_CONFIRM',
              params: { name: finalData.name, patientId },
              text: language === 'EN'
                ? `Processing emergency registration... Account generated for ${finalData.name}.\n\nPatient ID: ${patientId}\nRecommended: Lari Cardiology Emergency`
                : `आपातकालीन पंजीकरण किया जा रहा है... ${finalData.name} के लिए खाता तैयार।\n\nरोगी आईडी: ${patientId}\nसुझाव: लारी कार्डियोलॉजी इमरजेंसी`,
              timestamp: timeStr
            };

            const bypassCard = {
              id: prev.length + 2,
              sender: 'bot',
              isBypassCard: true,
              type: 'CRITICAL_BYPASS',
              text: language === 'EN'
                ? `🚨 CRITICAL CARDIOVASCULAR EMERGENCY. Proceed immediately to Lari Cardiology Emergency. Your queue number has been bypassed. Show this screen at the gate.`
                : `🚨 गंभीर हृदय आपातकाल। तुरंत लारी कार्डियोलॉजी इमरजेंसी (Lari Cardiology Emergency) में जाएं। आपका नंबर बाईपास कर दिया गया है। गेट पर यह स्क्रीन दिखाएं।`,
              patientId: patientId,
              timestamp: timeStr
            };
            return [...prev, botReply, bypassCard];
          });
          onCriticalTriage(criticalPatient);
          setRegisteredPatientId(patientId);
          setCurrentState(CHAT_STATE.COMPLETED);
        } else {
          // Normal Route - Calculate wait time
          const isFever = finalData.symptoms.toLowerCase().includes('fever') || 
                          finalData.symptoms.toLowerCase().includes('cold') || 
                          finalData.symptoms.toLowerCase().includes('बुखार') || 
                          finalData.symptoms.toLowerCase().includes('जुकाम');
          
          const dept = isFever ? 'General Medicine' : 'Trauma/Emergency';
          const severity = isFever ? 2 : 3;
          const wait = getEstimatedWait(dept, severity);

          // Proactive Load Balancer Redirect check
          if (wait >= 20) {
            const congestionText = language === 'EN'
              ? `⚠️ *KGMU AI:* KGMU ${dept} is experiencing high congestion. Estimated wait time is **${wait} minutes**.\n\nLucknow Civil Hospital is operating at low load with a wait time of only **15 minutes**.\n\nWould you like me to redirect and register your slot at **Lucknow Civil Hospital** instead for faster treatment?`
              : `⚠️ *KGMU AI:* KGMU ${dept} में अत्यधिक भीड़ है। अनुमानित प्रतीक्षा समय **${wait} मिनट** है।\n\nलखनऊ सिविल अस्पताल में वर्तमान में प्रतीक्षा समय केवल **15 मिनट** है।\n\nक्या आप अपना ओपीडी स्लॉट **लखनऊ सिविल अस्पताल** में पुनर्निर्देशित और पंजीकृत करना चाहेंगे?`;
            
            setMessages(prev => {
              const botReply = {
                id: prev.length + 1,
                sender: 'bot',
                type: 'CONGESTION_PROMPT',
                params: { dept, wait },
                text: congestionText,
                timestamp: timeStr
              };
              return [...prev, botReply];
            });
            setCurrentState(CHAT_STATE.AWAITING_CONGESTION_DECISION);
          } else {
            const normalPatient = {
              id: patientId,
              name: finalData.name,
              age: parseInt(finalData.age) || 35,
              gender: finalData.gender,
              mobile: finalData.mobile,
              symptoms: finalData.symptoms,
              department: dept,
              severity: severity,
              waitTime: wait,
              status: 'Awaiting Triage',
              isVoice: isVoice
            };

            setMessages(prev => {
              const botReply = {
                id: prev.length + 1,
                sender: 'bot',
                type: 'NORMAL_CONFIRM',
                params: { name: finalData.name, patientId, dept, severity, wait, mobile: finalData.mobile },
                text: language === 'EN'
                  ? `Appointment registered successfully for ${finalData.name}.\n\nPatient ID: ${patientId}\nRecommended Department: ${dept} OPD\nTriage Level: ${severity}\nEstimated wait: ${wait} mins.\n\nVerification SMS ticket sent to ${finalData.mobile}.`
                  : `पंजीकरण पूरा हुआ, ${finalData.name}।\n\nरोगी आईडी: ${patientId}\nअनुशंसित विभाग: KGMU ${dept === 'General Medicine' ? 'सामान्य चिकित्सा' : 'ट्रॉमा इमरजेंसी'} ओपीडी\nआपातकालीन स्तर: ${severity}\nअनुमानित प्रतीक्षा: ${wait} मिनट।\n\nSMS टिकट ${finalData.mobile} पर भेज दिया गया है।`,
                timestamp: timeStr
              };
              return [...prev, botReply];
            });
            onNormalTriage(normalPatient);
            setRegisteredPatientId(patientId);
            setCurrentState(CHAT_STATE.COMPLETED);
          }
        }
      } else if (currentState === CHAT_STATE.AWAITING_CONGESTION_DECISION) {
        // Step 6: Process Redirect Decision
        const isRedirect = messageText.toLowerCase().includes('civil') || messageText.includes('सिविल');
        const isFever = tempPatientData.symptoms.toLowerCase().includes('fever') || 
                        tempPatientData.symptoms.toLowerCase().includes('cold') || 
                        tempPatientData.symptoms.toLowerCase().includes('बुखार') || 
                        tempPatientData.symptoms.toLowerCase().includes('जुकाम');
        const dept = isFever ? 'General Medicine' : 'Trauma/Emergency';
        const severity = isFever ? 2 : 3;

        if (isRedirect) {
          const patientId = `CIVIL-${Math.floor(1000 + Math.random() * 9000)}`;
          const routedPatient = {
            id: patientId,
            name: tempPatientData.name,
            age: parseInt(tempPatientData.age) || 35,
            gender: tempPatientData.gender,
            mobile: tempPatientData.mobile,
            symptoms: tempPatientData.symptoms,
            department: 'Civil General OPD',
            severity: severity,
            waitTime: 15,
            status: 'Routed to Civil',
            isVoice: isVoice
          };

          setMessages(prev => {
            const botReply = {
              id: prev.length + 1,
              sender: 'bot',
              type: 'CIVIL_CONFIRM',
              params: { patientId },
              text: language === 'EN'
                ? `Slot registered successfully at Lucknow Civil Hospital General OPD.\n\nPatient ID: ${patientId}\nEstimated wait: 15 mins.\n\nAmbulance/transit load-balanced telemetry logged.`
                : `लखनऊ सिविल अस्पताल जनरल ओपीडी में स्लॉट सफलतापूर्वक पंजीकृत।\n\nरोगी आईडी: ${patientId}\nअनुमानित प्रतीक्षा: 15 मिनट।`,
              timestamp: timeStr
            };
            return [...prev, botReply];
          });
          onNormalTriage(routedPatient);
          setRegisteredPatientId(patientId);
          setCurrentState(CHAT_STATE.COMPLETED);
        } else {
          const patientId = `KGMU-${Math.floor(1000 + Math.random() * 9000)}`;
          const wait = getEstimatedWait(dept, severity);
          const normalPatient = {
            id: patientId,
            name: tempPatientData.name,
            age: parseInt(tempPatientData.age) || 35,
            gender: tempPatientData.gender,
            mobile: tempPatientData.mobile,
            symptoms: tempPatientData.symptoms,
            department: dept,
            severity: severity,
            waitTime: wait,
            status: 'Awaiting Triage',
            isVoice: isVoice
          };

          setMessages(prev => {
            const botReply = {
              id: prev.length + 1,
              sender: 'bot',
              type: 'KGMU_CONFIRM',
              params: { patientId, dept, severity, wait },
              text: language === 'EN'
                ? `Registered at KGMU.\n\nPatient ID: ${patientId}\nRecommended Department: ${dept} OPD\nTriage Level: ${severity}\nEstimated wait: ${wait} mins.`
                : `KGMU में पंजीकृत किया गया।\n\nरोगी आईडी: ${patientId}\nअनुशंसित विभाग: KGMU ${dept === 'General Medicine' ? 'सामान्य चिकित्सा' : 'ट्रॉमा इमरजेंसी'} ओपीडी\nअनुमानित प्रतीक्षा: ${wait} मिनट।`,
              timestamp: timeStr
            };
            return [...prev, botReply];
          });
          onNormalTriage(normalPatient);
          setRegisteredPatientId(patientId);
          setCurrentState(CHAT_STATE.COMPLETED);
        }
      }
    }, 1200);
  };

  const cancelRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsRecording(false);
  };

  const handleVoiceRecord = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (isRecording) {
      cancelRecording();
      return;
    }

    if (!SpeechRecognition) {
      // Fallback: Use simulator presets if browser does not support Web Speech API
      setIsRecording(true);
      setIsVoice(true);
      setTimeout(() => {
        setIsRecording(recording => {
          if (recording) {
            if (currentState === CHAT_STATE.AWAITING_SYMPTOMS) {
              const voiceText = language === 'EN' 
                ? symptomPresets[0].symptomsEn 
                : symptomPresets[0].symptomsHi;
              setTimeout(() => handleSend(voiceText), 500);
            } else if (currentState === CHAT_STATE.AWAITING_NAME) {
              setTimeout(() => handleSend(language === 'EN' ? 'Aditya Pandey' : 'आदित्य पाण्डेय'), 500);
            } else if (currentState === CHAT_STATE.AWAITING_AGE) {
              setTimeout(() => handleSend('48'), 500);
            } else if (currentState === CHAT_STATE.AWAITING_GENDER) {
              setTimeout(() => handleSend('Male'), 500);
            } else if (currentState === CHAT_STATE.AWAITING_MOBILE) {
              setTimeout(() => handleSend('9876543210'), 500);
            }
            return false;
          }
          return false;
        });
      }, 2500);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = language === 'EN' ? 'en-US' : 'hi-IN';

      rec.onstart = () => {
        setIsRecording(true);
        setInput('');
      };

      rec.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(currentTranscript);
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        cancelRecording();
      };

      rec.onend = () => {
        setIsRecording(false);
        setIsVoice(true);
        // Automatically send the accumulated input when they stop speaking if there is any input
        setTimeout(() => {
          setInput(current => {
            if (current.trim()) {
              handleSend(current);
            }
            return '';
          });
        }, 600);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error(e);
      // Fallback
      setIsRecording(true);
      setIsVoice(true);
      setTimeout(() => {
        setIsRecording(false);
        if (currentState === CHAT_STATE.AWAITING_SYMPTOMS) {
          const voiceText = language === 'EN' ? symptomPresets[0].symptomsEn : symptomPresets[0].symptomsHi;
          handleSend(voiceText);
        }
      }, 2500);
    }
  };

  const resetChat = () => {
    setTempPatientData({
      symptoms: '',
      name: '',
      age: '',
      gender: '',
      mobile: '',
      isCritical: false
    });
    setRegisteredPatientId(null);
    setIsVoice(false);
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: language === 'EN' 
          ? "Welcome to KGMU AI Triage. 🏥\n\nI am the KGMU Emergency Assistant. Please describe your symptoms in detail so I can determine your triage level.\n\nYou can type your symptoms, use the quick buttons below, or hold the mic 🎙️ to send a voice note."
          : "KGMU AI ट्राइएज में आपका स्वागत है। 🏥\n\nमैं KGMU आपातकालीन सहायक हूँ। कृपया अपने लक्षणों का विस्तार से वर्णन करें ताकि मैं आपकी आपातकालीन गंभीरता (Triage Level) निर्धारित कर सकूं।\n\nआप नीचे दिए गए बटनों का उपयोग कर सकते हैं, टाइप कर सकते हैं, या वॉयस नोट भेजने के लिए माइक 🎙️ बटन दबा सकते हैं।",
        timestamp: '20:16'
      }
    ]);
    setInput('');
    setIsTyping(false);
    setIsRecording(false);
    setCurrentState(CHAT_STATE.AWAITING_SYMPTOMS);
  };

  const getPatientQueuePosition = (patientId) => {
    const patient = queueData.find(p => p.id === patientId);
    if (!patient) return 0;
    if (patient.status === 'In Treatment' || patient.status === 'Routed to Civil') return 0;
    
    const sameDeptWaiting = queueData.filter(p => 
      p.department === patient.department && 
      p.status !== 'In Treatment' && 
      p.status !== 'Routed to Civil'
    );
    
    const index = sameDeptWaiting.findIndex(p => p.id === patientId);
    if (index === -1) return 0;
    return sameDeptWaiting.length - index;
  };

  const getSuggestionChips = () => {
    if (currentState === CHAT_STATE.AWAITING_SYMPTOMS) {
      return symptomPresets.map(preset => (
        <button
          key={preset.id}
          onClick={() => handleSend(language === 'EN' ? preset.symptomsEn : preset.symptomsHi)}
          className="inline-block bg-white border border-slate-200 hover:border-slate-350 rounded-full px-3 py-1.5 text-[10px] text-slate-700 font-semibold hover:text-slate-900 transition-all cursor-pointer shadow-3xs"
        >
          {preset.label}
        </button>
      ));
    }

    if (currentState === CHAT_STATE.ANALYZING_SYMPTOMS) {
      return null;
    }

    if (currentState === CHAT_STATE.AWAITING_NAME) {
      return (
        <button
          onClick={() => handleSend(language === 'EN' ? 'Aditya Pandey' : 'आदित्य पाण्डेय')}
          className="inline-block bg-white border border-slate-200 hover:border-slate-350 rounded-full px-3 py-1.5 text-[10px] text-slate-700 font-semibold hover:text-slate-900 transition-all cursor-pointer shadow-3xs"
        >
          {language === 'EN' ? 'Fill demo: Aditya Pandey' : 'डेमो भरें: आदित्य पाण्डेय'}
        </button>
      );
    }

    if (currentState === CHAT_STATE.AWAITING_AGE) {
      return ['28', '45', '67'].map(age => (
        <button
          key={age}
          onClick={() => handleSend(age)}
          className="inline-block bg-white border border-slate-200 hover:border-slate-350 rounded-full px-4 py-1.5 text-[10px] text-slate-700 font-bold hover:text-slate-900 transition-all cursor-pointer shadow-3xs"
        >
          {age}
        </button>
      ));
    }

    if (currentState === CHAT_STATE.AWAITING_GENDER) {
      const genders = language === 'EN' ? ['Male', 'Female', 'Other'] : ['Male', 'Female', 'Other'];
      return genders.map(gen => (
        <button
          key={gen}
          onClick={() => handleSend(gen)}
          className="inline-block bg-white border border-slate-200 hover:border-slate-350 rounded-full px-4 py-1.5 text-[10px] text-slate-700 font-bold hover:text-slate-900 transition-all cursor-pointer shadow-3xs"
        >
          {gen}
        </button>
      ));
    }

    if (currentState === CHAT_STATE.AWAITING_MOBILE) {
      return (
        <button
          onClick={() => handleSend('9876543210')}
          className="inline-block bg-white border border-slate-200 hover:border-slate-350 rounded-full px-3 py-1.5 text-[10px] text-slate-700 font-semibold hover:text-slate-900 transition-all cursor-pointer shadow-3xs"
        >
          {language === 'EN' ? 'Demo Mobile: 9876543210' : 'डेमो नंबर: 9876543210'}
        </button>
      );
    }

    if (currentState === CHAT_STATE.AWAITING_CONGESTION_DECISION) {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleSend(language === 'EN' ? 'Route to Civil Hospital 🏢' : 'सिविल अस्पताल 🏢')}
            className="inline-block bg-purple-50 border border-purple-200 hover:border-purple-300 rounded-full px-3.5 py-1.5 text-[10px] text-purple-700 font-bold hover:text-purple-900 transition-all cursor-pointer shadow-3xs"
          >
            {language === 'EN' ? 'Route to Civil Hospital 🏢' : 'सिविल अस्पताल 🏢'}
          </button>
          <button
            onClick={() => handleSend(language === 'EN' ? 'Continue at KGMU 🏥' : 'KGMU में प्रतीक्षा करें 🏥')}
            className="inline-block bg-white border border-slate-200 hover:border-slate-350 rounded-full px-3.5 py-1.5 text-[10px] text-slate-750 font-bold hover:text-slate-900 transition-all cursor-pointer shadow-3xs"
          >
            {language === 'EN' ? 'Continue at KGMU 🏥' : 'KGMU में ही रहें 🏥'}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 select-none">
      {/* Mobile Shell */}
      <div className="w-[360px] h-[640px] rounded-[44px] border-[10px] border-slate-800 bg-white relative flex flex-col overflow-hidden shadow-[0_15px_45px_rgba(15,23,42,0.12)] border-t-[12px] border-b-[12px]">
        {/* Notch / Speaker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-40 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
          <div className="w-2.5 h-2.5 bg-slate-700 rounded-full ml-3" />
        </div>

        {/* Status Bar */}
        <div className="h-6 pt-1.5 px-6 flex justify-between items-center text-[10px] text-slate-550 font-semibold z-30 bg-white border-b border-slate-100">
          <span>20:16</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[6px] font-bold text-slate-600">5G</span>
            <div className="w-3.5 h-2 border border-slate-400 rounded-sm p-[1px] flex items-center">
              <div className="w-2.5 h-full bg-slate-600 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* WhatsApp Header */}
        <div className="bg-[#128c7e] px-4 py-3 flex items-center justify-between z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-white text-xs">
                K
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#128c7e] animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white leading-tight">KGMU AI Triage</h3>
              <p className="text-[9px] text-emerald-200 font-bold leading-none flex items-center gap-1 mt-0.5">
                Online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <button 
              onClick={() => setLanguage(language === 'EN' ? 'HI' : 'EN')}
              className="flex items-center gap-1 bg-white/10 border border-white/20 hover:border-white/40 rounded-lg px-2 py-1 text-[10px] text-white font-bold transition-all"
            >
              <Languages className="w-3 h-3 text-white" />
              {language}
            </button>
            <button onClick={resetChat} title="Reset Chat" className="p-1 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 hover:border-white/40 text-white/85 hover:text-white transition-all">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chat Area or Live Queue Pass */}
        {currentState === CHAT_STATE.COMPLETED ? (
          <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-between items-center relative text-center">
            {/* Soft backdrop blurs */}
            <div className="absolute top-4 left-4 w-24 h-24 bg-cyan-100/50 rounded-full blur-xl pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-24 h-24 bg-blue-100/50 rounded-full blur-xl pointer-events-none" />

            <div className="w-full space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-205 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCheck className="w-6 h-6" />
              </div>
              
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Triage Pass Registered</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Live KGMU Telemetry</p>
              </div>

              {(() => {
                const patient = queueData.find(p => p.id === registeredPatientId);
                const name = patient?.name || tempPatientData.name || 'Patient';
                const id = patient?.id || registeredPatientId || 'KGMU-4932';
                const dept = patient?.department || 'General Medicine';
                const severity = patient?.severity || 2;
                const status = patient?.status || 'Awaiting Triage';
                const waitTime = patient?.waitTime ?? 15;
                
                const queuePosition = getPatientQueuePosition(id);

                return (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm text-left space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Patient ID</span>
                        <strong className="text-xs text-slate-900 font-extrabold">{id}</strong>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        severity === 5 ? 'bg-red-50 text-red-650 border border-red-200 animate-pulse' :
                        severity === 4 ? 'bg-orange-50 text-orange-650 border border-orange-200' :
                        severity === 3 ? 'bg-yellow-50 text-yellow-650 border border-yellow-250' :
                        'bg-cyan-50 text-cyan-650 border border-cyan-200'
                      }`}>
                        Level {severity}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Name</span>
                      <strong className="text-xs text-slate-900 font-bold">{name}</strong>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Department</span>
                      <strong className="text-xs text-slate-900 font-bold">{dept}</strong>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500 uppercase tracking-wider">Live Position</span>
                        <span className="text-cyan-700">
                          {status === 'In Treatment' ? 'Called 🚪' :
                           status === 'Routed to Civil' ? 'Routed 🚚' :
                           queuePosition > 0 ? `#${queuePosition} in line` : 'Processing'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500 uppercase tracking-wider">Est. Wait</span>
                        <span className={waitTime === 0 ? 'text-red-650 font-bold' : 'text-slate-800 font-bold'}>
                          {status === 'In Treatment' ? 'Now inside' :
                           status === 'Routed to Civil' ? 'Transit (~18m)' :
                           waitTime === 0 ? 'Bypassed ⚡' : `${waitTime} mins`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-semibold pt-1 border-t border-slate-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live synced with hospital desk</span>
                      </div>
                    </div>

                    <div className="pt-3 flex flex-col items-center gap-1.5 border-t border-slate-100">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`BEGIN:VCARD\nVERSION:3.0\nN:${name}\nORG:${dept} (Severity: ${severity})\nTITLE:Patient ID: ${id}\nEND:VCARD`)}&color=1e293b&bgcolor=ffffff&qzone=1&format=svg`}
                        alt={`QR Code for ${id}`}
                        className="w-[90px] h-[90px] rounded-md border border-slate-200 shadow-3xs"
                      />
                      <span className="text-[8px] font-mono text-slate-400 tracking-widest">{id}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="w-full space-y-2 mt-4 select-none">
              <button 
                onClick={() => alert(`Directions: Proceed to KGMU Outpatient Department (OPD) block, Corridor B, Room 104. Hospital staff will call Patient ID when estimated wait reaches zero.`)}
                className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-650 hover:text-slate-800 transition-all cursor-pointer shadow-3xs"
              >
                🏥 View Room Directions
              </button>
              
              <button 
                onClick={resetChat}
                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-3xs"
              >
                Register New Patient
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efeae2] relative">
              {messages.map((msg) => {
                const textContent = msg.type ? (getLocalizedMessageText(msg.type, language, msg.params) || msg.text) : msg.text;

                if (msg.isBypassCard) {
                  return (
                    <div 
                      key={msg.id}
                      className="bg-red-50 border-2 border-red-400/80 rounded-2xl p-4 shadow-[0_4px_12px_rgba(220,38,38,0.08)] animate-bounce-slow text-center my-3 relative overflow-hidden"
                    >
                      <div className="absolute -right-4 -top-4 w-12 h-12 bg-red-100 rounded-full border border-red-200 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-650 animate-pulse" />
                      </div>
                      <h4 className="text-red-750 font-bold text-xs uppercase tracking-wider mb-1.5 flex items-center justify-center gap-1.5">
                        Critical Bypass Protocol
                      </h4>
                      <p className="text-[11px] text-slate-800 leading-relaxed font-semibold">
                        {textContent}
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-red-200 flex justify-between items-center text-[10px] text-red-700 font-mono font-bold">
                        <span>ID: {msg.patientId}</span>
                        <span className="bg-red-100 border border-red-200 px-2 py-0.5 rounded text-[8px] font-bold text-red-700">PRIORITY 1</span>
                      </div>
                    </div>
                  );
                }

                const isUser = msg.sender === 'user';
                return (
                  <div 
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] leading-relaxed whitespace-pre-line ${
                        isUser 
                          ? 'bg-[#d9fdd3] text-slate-850 rounded-tr-none' 
                          : 'bg-white text-slate-855 rounded-tl-none'
                      }`}
                    >
                      {textContent}
                      <div className={`text-[8px] text-right mt-1.5 font-mono ${isUser ? 'text-slate-500' : 'text-slate-400'}`}>
                        {msg.timestamp} {isUser && <CheckCheck className="w-3 h-3 inline-block ml-1 text-sky-500" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-1 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Recording Animation Modal Overlay inside Phone */}
            {isRecording && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-4 animate-fade-in">
                <div className="relative">
                  <span className="absolute inset-0 w-16 h-16 bg-cyan-100 rounded-full animate-ping" />
                  <div className="w-16 h-16 bg-cyan-50 border border-cyan-200 rounded-full flex items-center justify-center text-cyan-600 relative z-10">
                    <Mic className="w-8 h-8 animate-pulse" />
                  </div>
                </div>
                <div className="text-center px-4 max-w-full">
                  <p className="text-sm font-bold text-slate-800">
                    {language === 'EN' ? 'Listening to Patient...' : 'मरीज की आवाज सुन रहे हैं...'}
                  </p>
                  <p className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-650 mt-2 font-mono font-medium min-h-[50px] flex items-center justify-center break-words max-w-[280px]">
                    {input.trim() ? input : (language === 'EN' ? "Speak now..." : "कृपया बोलना शुरू करें...")}
                  </p>
                </div>
                <button 
                  onClick={cancelRecording}
                  className="mt-4 px-4 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-700 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Cancel Recording
                </button>
              </div>
            )}

            {/* Suggestion Chips */}
            <div className="px-3 py-2 bg-[#f0f2f5] border-t border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
              {getSuggestionChips()}
            </div>

            {/* Bottom Input Area */}
            <div className="p-3 bg-[#f0f2f5] border-t border-slate-200 flex items-center gap-2 select-none">
              <button 
                onClick={handleVoiceRecord}
                className={`p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer shadow-3xs ${
                  isRecording 
                    ? 'bg-red-50 border-red-200 text-red-650' 
                    : 'bg-white border-slate-200 text-slate-555 hover:text-slate-700'
                }`}
                title="Simulate Voice Input"
              >
                <Mic className="w-4 h-4" />
              </button>
              
              <input
                type="text"
                placeholder={
                  currentState === CHAT_STATE.AWAITING_SYMPTOMS ? (language === 'EN' ? "Type symptoms..." : "लक्षण लिखें...") :
                  currentState === CHAT_STATE.ANALYZING_SYMPTOMS ? (language === 'EN' ? "AI parsing..." : "AI विश्लेषण...") :
                  currentState === CHAT_STATE.AWAITING_NAME ? (language === 'EN' ? "Type full name..." : "पूरा नाम लिखें...") :
                  currentState === CHAT_STATE.AWAITING_AGE ? (language === 'EN' ? "Type age..." : "उम्र लिखें...") :
                  currentState === CHAT_STATE.AWAITING_GENDER ? (language === 'EN' ? "Type gender..." : "लिंग लिखें...") :
                  currentState === CHAT_STATE.AWAITING_MOBILE ? (language === 'EN' ? "Type mobile..." : "मोबाइल लिखें...") :
                  currentState === CHAT_STATE.AWAITING_CONGESTION_DECISION ? (language === 'EN' ? "Select option..." : "विकल्प चुनें...") :
                  (language === 'EN' ? "Chat completed..." : "चैट पूर्ण...")
                }
                value={input}
                disabled={currentState === CHAT_STATE.COMPLETED || currentState === CHAT_STATE.ANALYZING_SYMPTOMS}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#128c7e] transition-all shadow-3xs disabled:bg-slate-100 disabled:text-slate-400"
              />

              <button 
                onClick={() => handleSend()}
                disabled={currentState === CHAT_STATE.COMPLETED || currentState === CHAT_STATE.ANALYZING_SYMPTOMS}
                className="p-2.5 rounded-full bg-[#128c7e] text-white shadow-md shadow-[#128c7e]/15 hover:bg-[#0e7064] transition-all flex items-center justify-center cursor-pointer hover:scale-105 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Simulation tips */}
      <div className="mt-3 text-center">
        <p className="text-[10px] text-slate-550 max-w-[280px] font-semibold">
          💡 Click the chip <strong className="text-cyan-700">"Fill demo: Aditya Pandey"</strong> during the name step to quickly complete registration!
        </p>
      </div>
    </div>
  );
}
