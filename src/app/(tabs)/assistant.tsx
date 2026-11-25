import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import * as Speech from 'expo-speech';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { AudioWaveform } from '../../components/AudioWaveform';
import { useFarm } from '../../context/FarmContext';

const LANGUAGES = [
  { code: 'auto', label: 'Auto Detect 🌐', bcp47: 'kn-IN' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', bcp47: 'kn-IN' },
  { code: 'hi', label: 'हिन्दी (Hindi)', bcp47: 'hi-IN' },
  { code: 'en', label: 'English', bcp47: 'en-IN' },
  { code: 'te', label: 'తెలుగు (Telugu)', bcp47: 'te-IN' },
  { code: 'ta', label: 'தமிழ் (Tamil)', bcp47: 'ta-IN' },
  { code: 'ml', label: 'മലയാളം (Malayalam)', bcp47: 'ml-IN' },
  { code: 'mr', label: 'मराठी (Marathi)', bcp47: 'mr-IN' },
];

/** Fast Client-side language detector by unicode script and agronomic keywords */
function detectClientLanguage(text: string): { code: string; label: string; bcp47: string } {
  if (!text) return { code: 'en', label: 'English', bcp47: 'en-IN' };

  // Kannada Unicode block
  if (/[\u0C80-\u0CFF]/.test(text)) {
    return { code: 'kn', label: 'ಕನ್ನಡ', bcp47: 'kn-IN' };
  }
  // Devanagari Unicode block (Hindi / Marathi)
  if (/[\u0900-\u097F]/.test(text)) {
    return { code: 'hi', label: 'हिन्दी', bcp47: 'hi-IN' };
  }
  // Telugu Unicode block
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return { code: 'te', label: 'తెలుగు', bcp47: 'te-IN' };
  }
  // Tamil Unicode block
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return { code: 'ta', label: 'தமிழ்', bcp47: 'ta-IN' };
  }
  // Malayalam Unicode block
  if (/[\u0D00-\u0D7F]/.test(text)) {
    return { code: 'ml', label: 'മലയാളം', bcp47: 'ml-IN' };
  }

  // Romanized Kannada check
  const lower = text.toLowerCase();
  const knWords = [
    'ragi', 'bele', 'neeru', 'mannu', 'beku', 'enu', 'estu', 'yavaga',
    'madabeku', 'tumba', 'nanna', 'hola', 'krishi', 'hasu', 'kodu',
  ];
  if (knWords.some((w) => new RegExp(`\\b${w}\\b`).test(lower))) {
    return { code: 'kn', label: 'ಕನ್ನಡ', bcp47: 'kn-IN' };
  }

  // Romanized Hindi check
  const hiWords = [
    'paani', 'fasal', 'khet', 'kitna', 'khad', 'kab', 'kya', 'kaise',
    'kisan', 'mitti', 'dawa', 'chhidkaw', 'meri', 'mera',
  ];
  if (hiWords.some((w) => new RegExp(`\\b${w}\\b`).test(lower))) {
    return { code: 'hi', label: 'हिन्दी', bcp47: 'hi-IN' };
  }

  return { code: 'en', label: 'English', bcp47: 'en-IN' };
}

export default function AssistantScreen() {
  const {
    farmDetails,
    chatMessages,
    chatSending,
    assistantLanguage,
    setAssistantLanguage,
    clearChatHistory,
    sendChatMessage,
    transcribeVoice,
  } = useFarm();

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const [inputText, setInputText] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Real Audio Recording & STT state
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [detectedToast, setDetectedToast] = useState<{
    text: string;
    language: string;
    name: string;
  } | null>(null);

  // Pulse animation for recording ring
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const cropName = farmDetails?.cropGrown || 'Ragi';
  const soilName = farmDetails?.soilType || 'Red Loam';

  // Live timer while recording
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((sec) => sec + 1);
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 650,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      setRecordSeconds(0);
      pulseAnim.setValue(1);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, pulseAnim]);

  // Multilingual dynamic suggestions tailored to the active language
  const getSuggestions = () => {
    if (assistantLanguage === 'kn') {
      return [
        'ನನ್ನ ಜಮೀನಿನಲ್ಲಿ ತೇವಾಂಶ ಏಕೆ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ?',
        `ನನ್ನ ${cropName} ಬೆಳೆಗೆ ಯಾವ ಗೊಬ್ಬರ ಮತ್ತು ನೀರು ಉತ್ತಮ?`,
        `ಕೀಟ ಮತ್ತು ರೋಗಗಳಿಂದ ${cropName} ರಕ್ಷಿಸುವುದು ಹೇಗೆ?`,
        'ನಾಳೆಯ ಹವಾಮಾನದಲ್ಲಿ ಮಳೆಯ ಸಾಧ್ಯತೆ ಎಷ್ಟಿದೆ?',
      ];
    }
    if (assistantLanguage === 'hi') {
      return [
        'मेरे खेत की नमी क्यों कम हो रही है?',
        `मेरी ${cropName} फसल के लिए कौन सी खाद सबसे अच्छी है?`,
        `कीटों और रोगों से ${cropName} फसल को कैसे बचाएं?`,
        'कल के मौसम में बारिश का क्या अनुमान है?',
      ];
    }
    return [
      'Why is my soil moisture decreasing?',
      `What fertilizer schedule is best for my ${cropName} in ${soilName}?`,
      `How do I protect my ${cropName} from pests and leaf diseases?`,
      "Will tomorrow's rainfall affect irrigation?",
    ];
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Start voice recording with expo-audio
  const startVoiceRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        alert('Microphone permission is required to capture your voice query.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      Speech.stop();
      setSpeakingId(null);
      setDetectedToast(null);

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setIsRecording(true);
    } catch (err) {
      console.warn('[Voice] Failed to start recording:', err);
      setIsRecording(false);
    }
  };

  // Stop voice recording, transcribe with auto language detection, and send
  const stopVoiceRecording = async () => {
    setIsRecording(false);
    setIsTranscribing(true);

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (!uri) {
        setIsTranscribing(false);
        return;
      }

      // Convert audio file to base64 using File (with fallback)
      let base64Data = '';
      try {
        const file = new File(uri);
        base64Data = await file.base64();
      } catch (fsErr) {
        console.warn('[Voice] File.base64() error, falling back to fetch blob:', fsErr);
        const response = await fetch(uri);
        const blob = await response.blob();
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const rawResult = reader.result as string;
            resolve(rawResult.includes(',') ? rawResult.split(',')[1] : rawResult);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      if (!base64Data || !base64Data.trim()) {
        setIsTranscribing(false);
        setDetectedToast({
          text: 'No audio captured. Please hold the mic and speak clearly.',
          language: 'en',
          name: 'Try Again',
        });
        setTimeout(() => setDetectedToast(null), 4000);
        return;
      }

      const mimeType = uri.endsWith('.3gp') ? 'audio/3gpp' : uri.endsWith('.wav') ? 'audio/wav' : 'audio/m4a';
      const stt = await transcribeVoice(base64Data, mimeType, assistantLanguage);
      setIsTranscribing(false);

      if (stt && stt.ok && stt.text && stt.text.trim()) {
        const detected = detectClientLanguage(stt.text);
        const langCode = stt.language && stt.language !== 'en' ? stt.language : detected.code;

        setDetectedToast({
          text: `"${stt.text}"`,
          language: langCode,
          name: stt.languageName || detected.label,
        });
        setTimeout(() => setDetectedToast(null), 5000);

        // Update UI language so user sees the detected language
        setAssistantLanguage(langCode);

        // Automatically send query to assistant in the detected language
        await sendChatMessage(stt.text, langCode);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 140);
      } else {
        setDetectedToast({
          text: stt?.error || 'Voice captured, but words could not be recognized. Please speak closer to the mic.',
          language: 'en',
          name: 'Try Again',
        });
        setTimeout(() => setDetectedToast(null), 4000);
      }
    } catch (err) {
      console.warn('[Voice] Failed to stop recording:', err);
      setIsRecording(false);
      setIsTranscribing(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query || chatSending) return;
    setInputText('');

    // Auto-detect language from query text
    const detected = detectClientLanguage(query);
    const targetLang = assistantLanguage === 'auto' ? detected.code : assistantLanguage;

    if (assistantLanguage === 'auto' && detected.code !== 'en') {
      setAssistantLanguage(detected.code);
    }

    await sendChatMessage(query, targetLang);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 140);
  };

  const handleSpeak = (id: string, text: string, msgLang?: string) => {
    if (speakingId === id) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }
    Speech.stop();

    // Auto-detect speech language from message text or msgLang
    const detected = detectClientLanguage(text);
    const langCode = msgLang && msgLang !== 'auto' ? msgLang : detected.code;
    const langObj = LANGUAGES.find((l) => l.code === langCode) || LANGUAGES.find((l) => l.code === 'en')!;

    setSpeakingId(id);
    Speech.speak(text, {
      language: langObj.bcp47,
      rate: 0.95,
      pitch: 1.0,
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.botIconWrapper}>
              <Ionicons name="leaf" size={18} color={Colors.oliveGreen} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Root Sense AI</Text>
              <Text style={styles.headerSub}>Multilingual Voice Farming Assistant</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.dotsButton}
            onPress={() => setMenuOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.charcoal} />
          </TouchableOpacity>
        </View>

        {/* Language Strip with Auto-Detect */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.langBar}
          contentContainerStyle={styles.langBarContent}
        >
          {LANGUAGES.map((lang) => {
            const active = assistantLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langChip, active && styles.langChipActive]}
                onPress={() => setAssistantLanguage(lang.code)}
                activeOpacity={0.8}
              >
                <Text style={[styles.langChipText, active && styles.langChipTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Chat History */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.map((m, idx) => {
            const isUser = m.sender === 'user';
            const detected = detectClientLanguage(m.text);

            return (
              <View
                key={`${m.id}-${idx}`}
                style={[
                  styles.messageRow,
                  isUser ? styles.userRow : styles.assistantRow,
                ]}
              >
                {!isUser && (
                  <View style={styles.avatarCircle}>
                    <Ionicons name="leaf" size={14} color={Colors.oliveGreen} />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  {/* Language pill indicator */}
                  <View style={styles.langTagRow}>
                    <Text style={[styles.langTagText, isUser && styles.langTagTextUser]}>
                      {detected.label}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.messageText,
                      isUser ? styles.userText : styles.assistantText,
                    ]}
                  >
                    {m.text}
                  </Text>

                  {!isUser && (
                    <View style={styles.assistantActionsRow}>
                      <TouchableOpacity
                        onPress={() => handleSpeak(m.id, m.text, m.language)}
                        style={styles.iconAction}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={
                            speakingId === m.id
                              ? 'stop-circle'
                              : 'volume-medium-outline'
                          }
                          size={18}
                          color={
                            speakingId === m.id
                              ? Colors.oliveGreen
                              : Colors.mutedGrey
                          }
                        />
                      </TouchableOpacity>
                      <View style={styles.thumbRow}>
                        <TouchableOpacity style={styles.iconAction}>
                          <Ionicons
                            name="thumbs-up-outline"
                            size={15}
                            color={Colors.mutedGrey}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconAction}>
                          <Ionicons
                            name="thumbs-down-outline"
                            size={15}
                            color={Colors.mutedGrey}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {chatSending && (
            <View style={[styles.messageRow, styles.assistantRow]}>
              <View style={styles.avatarCircle}>
                <Ionicons name="leaf" size={14} color={Colors.oliveGreen} />
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
                <ActivityIndicator size="small" color={Colors.oliveGreen} />
                <Text style={styles.typingText}>
                  {assistantLanguage === 'kn'
                    ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...'
                    : assistantLanguage === 'hi'
                    ? 'आपके प्रश्न का विश्लेषण किया जा रहा है...'
                    : 'Analyzing your field data...'}
                </Text>
              </View>
            </View>
          )}

          {/* Suggested Questions in user's active language */}
          <View style={styles.suggestedContainer}>
            <Text style={styles.suggestedHeader}>
              {assistantLanguage === 'kn'
                ? 'ನಿಮ್ಮ ಜಮೀನಿಗಾಗಿ ಸಲಹಾ ಪ್ರಶ್ನೆಗಳು'
                : assistantLanguage === 'hi'
                ? 'आपके खेत के लिए सुझाव प्रश्न'
                : 'Suggested questions for your field'}
            </Text>
            {getSuggestions().map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionPill}
                onPress={() => handleSend(q)}
                activeOpacity={0.7}
              >
                <Ionicons name="sparkles" size={14} color={Colors.oliveGreen} />
                <Text style={styles.suggestionText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Auto-detected language notification toast */}
        {detectedToast && (
          <View style={styles.toastCard}>
            <Ionicons name="globe-outline" size={18} color="#27AE60" />
            <View style={{ flex: 1 }}>
              <Text style={styles.toastTitle}>Auto-detected: {detectedToast.name}</Text>
              <Text style={styles.toastSub} numberOfLines={1}>"{detectedToast.text}"</Text>
            </View>
            <TouchableOpacity onPress={() => setDetectedToast(null)}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Transcribing loader banner */}
        {isTranscribing && (
          <View style={styles.transcribingBanner}>
            <ActivityIndicator size="small" color={Colors.oliveGreen} />
            <Text style={styles.transcribingText}>
              Auto-detecting language &amp; converting speech to text...
            </Text>
          </View>
        )}

        {/* Bottom Voice / Text Input Bar */}
        <View style={styles.bottomBar}>
          {/* Animated Mic Button */}
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && styles.micButtonActive,
            ]}
            onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="stop" size={20} color={Colors.pureWhite} />
              </Animated.View>
            ) : (
              <Ionicons name="mic" size={22} color={Colors.charcoal} />
            )}
          </TouchableOpacity>

          <View style={styles.centerInputArea}>
            {isRecording ? (
              <View style={styles.recordingLiveBox}>
                <View style={styles.recordingTimerRow}>
                  <View style={styles.recordingRedDot} />
                  <Text style={styles.recordingTimerText}>REC {formatTimer(recordSeconds)}</Text>
                </View>
                <Text style={styles.recordingHintText}>
                  Listening in any language (ಕನ್ನಡ, हिन्दी, English...)
                </Text>
                <AudioWaveform isActive={true} />
              </View>
            ) : (
              <TextInput
                style={styles.chatTextInput}
                placeholder={
                  assistantLanguage === 'kn'
                    ? 'ಕನ್ನಡದಲ್ಲಿ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಕೇಳಿ...'
                    : assistantLanguage === 'hi'
                    ? 'हिन्दी या अंग्रेज़ी में पूछें...'
                    : `Ask anything about your ${cropName} field...`
                }
                placeholderTextColor={Colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
              />
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (chatSending || isTranscribing) && { opacity: 0.6 },
            ]}
            onPress={isRecording ? stopVoiceRecording : () => handleSend()}
            disabled={chatSending || isTranscribing}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isRecording ? 'checkmark' : 'arrow-up'}
              size={20}
              color={Colors.pureWhite}
            />
          </TouchableOpacity>
        </View>

        {/* Chat Options Menu */}
        <Modal visible={menuOpen} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Voice &amp; AI Settings</Text>

              <View style={styles.menuInfoBox}>
                <Ionicons name="mic-outline" size={18} color={Colors.oliveGreen} />
                <Text style={styles.menuInfoText}>
                  Speech-to-Text: Auto language detection enabled for Kannada, Hindi &amp; Indian languages.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.clearChatButton}
                onPress={async () => {
                  Speech.stop();
                  setSpeakingId(null);
                  await clearChatHistory();
                  setMenuOpen(false);
                }}
                activeOpacity={0.75}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
                <Text style={styles.clearChatText}>Clear Conversation History</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
  },
  flexOne: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  botIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.softCream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  headerSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
  dotsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBar: {
    maxHeight: 46,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.warmIvory,
  },
  langBarContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 7,
    gap: Spacing.xs,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.softCream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langChipActive: {
    backgroundColor: Colors.deepOlive,
    borderColor: Colors.deepOlive,
  },
  langChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  langChipTextActive: {
    color: Colors.pureWhite,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.softCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.soft,
  },
  userBubble: {
    backgroundColor: Colors.deepOlive,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.pureWhite,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langTagRow: {
    marginBottom: 4,
  },
  langTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.oliveGreen,
    textTransform: 'uppercase',
  },
  langTagTextUser: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  messageText: {
    fontSize: Typography.fontSizes.sm,
    lineHeight: 20,
  },
  userText: {
    color: Colors.pureWhite,
  },
  assistantText: {
    color: Colors.charcoal,
  },
  assistantActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  iconAction: {
    padding: 4,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  typingText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  suggestedContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  suggestedHeader: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.pureWhite,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.charcoal,
    flex: 1,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.xl,
    marginBottom: 6,
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#BBE6C7',
    ...Shadows.soft,
  },
  toastTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E7E43',
  },
  toastSub: {
    fontSize: 11,
    color: '#2A5A35',
  },
  transcribingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: Spacing.xl,
    marginBottom: 6,
    backgroundColor: Colors.softCream,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transcribingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.deepOlive,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.pureWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.softCream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  micButtonActive: {
    backgroundColor: '#E53935',
    borderColor: '#C62828',
  },
  centerInputArea: {
    flex: 1,
  },
  chatTextInput: {
    minHeight: 42,
    maxHeight: 90,
    backgroundColor: Colors.softCream,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    fontSize: Typography.fontSizes.sm,
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordingLiveBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 2,
  },
  recordingTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
  },
  recordingTimerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E53935',
  },
  recordingHintText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.oliveGreen,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.card,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  menuInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.softCream,
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  menuInfoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  clearChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearChatText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.error,
    fontWeight: '600',
  },
});
