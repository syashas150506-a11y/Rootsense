import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { AudioWaveform } from '../../components/AudioWaveform';
import { useFarm } from '../../context/FarmContext';

const LANGUAGES = [
  { code: 'en', label: 'English', bcp47: 'en-IN' },
  { code: 'kn', label: 'ಕನ್ನಡ', bcp47: 'kn-IN' },
  { code: 'hi', label: 'हिन्दी', bcp47: 'hi-IN' },
  { code: 'te', label: 'తెలుగు', bcp47: 'te-IN' },
  { code: 'ta', label: 'தமிழ்', bcp47: 'ta-IN' },
  { code: 'ml', label: 'മലയാളം', bcp47: 'ml-IN' },
  { code: 'mr', label: 'मराठी', bcp47: 'mr-IN' },
];

export default function AssistantScreen() {
  const {
    farmDetails,
    chatMessages,
    chatSending,
    assistantLanguage,
    setAssistantLanguage,
    clearChatHistory,
    sendChatMessage,
  } = useFarm();

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const cropName = farmDetails?.cropGrown || 'Ragi';
  const soilName = farmDetails?.soilType || 'Red Loam';

  const suggestedQuestions = [
    'Why is my soil moisture decreasing?',
    `What fertilizer schedule is best for my ${cropName} in ${soilName}?`,
    `How do I protect my ${cropName} from pests and leaf diseases?`,
    "Will tomorrow's rainfall affect irrigation?",
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query || chatSending) return;
    setInputText('');
    await sendChatMessage(query, assistantLanguage);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 140);
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }
    Speech.stop();
    const langObj = LANGUAGES.find((l) => l.code === assistantLanguage) || LANGUAGES[0];
    setSpeakingId(id);
    Speech.speak(text, {
      language: langObj.bcp47,
      rate: 0.95,
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
        {/* Clean Header (matching design without status badge pill) */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.botIconWrapper}>
              <Ionicons name="leaf" size={18} color={Colors.oliveGreen} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Root Sense AI</Text>
              <Text style={styles.headerSub}>Your personal farming companion.</Text>
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

        {/* Language Quick Strip */}
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
          {chatMessages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <View
                key={m.id}
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
                        onPress={() => handleSpeak(m.id, m.text)}
                        style={styles.iconAction}
                      >
                        <Ionicons
                          name={
                            speakingId === m.id
                              ? 'stop-circle'
                              : 'volume-medium-outline'
                          }
                          size={17}
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
                <Text style={styles.typingText}>Analyzing your field data...</Text>
              </View>
            </View>
          )}

          {/* Suggested Questions tailored to the Farmer's Field */}
          <View style={styles.suggestedContainer}>
            <Text style={styles.suggestedHeader}>Suggested questions for your field</Text>
            {suggestedQuestions.map((q, idx) => (
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

        {/* Bottom Voice / Text Input Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonActive]}
            onPress={() => setIsRecording(!isRecording)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isRecording ? 'mic' : 'mic-outline'}
              size={22}
              color={isRecording ? Colors.pureWhite : Colors.charcoal}
            />
          </TouchableOpacity>

          <View style={styles.centerInputArea}>
            {isRecording ? (
              <AudioWaveform isActive={true} />
            ) : (
              <TextInput
                style={styles.chatTextInput}
                placeholder={`Ask anything about your ${cropName} field...`}
                placeholderTextColor={Colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
              />
            )}
          </View>

          <TouchableOpacity
            style={[styles.sendButton, chatSending && { opacity: 0.6 }]}
            onPress={() => handleSend()}
            disabled={chatSending}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={20} color={Colors.pureWhite} />
          </TouchableOpacity>
        </View>

        {/* Simple Chat Options Menu */}
        <Modal visible={menuOpen} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Chat Options</Text>
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
    borderBottomColor: Colors.sandBeige,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  botIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  headerSub: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.mutedGrey,
  },
  dotsButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBar: {
    maxHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: Colors.sandBeige,
  },
  langBarContent: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: Colors.oliveGreen,
    borderColor: Colors.oliveGreen,
  },
  langChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.charcoal,
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
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
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
    backgroundColor: '#EBF2DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: Colors.deepOlive,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.softCream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.mutedGrey,
  },
  messageText: {
    fontSize: Typography.fontSizes.sm,
    lineHeight: 20,
  },
  userText: {
    color: Colors.pureWhite,
    fontWeight: '500',
  },
  assistantText: {
    color: Colors.charcoal,
  },
  assistantActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(236, 224, 194, 0.6)',
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconAction: {
    padding: 4,
  },
  suggestedContainer: {
    marginTop: Spacing.md,
    gap: Spacing.xs + 2,
  },
  suggestedHeader: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: 4,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pureWhite,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: Typography.fontSizes.xs + 1,
    color: Colors.charcoal,
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.warmIvory,
    borderTopWidth: 1,
    borderTopColor: Colors.sandBeige,
    gap: Spacing.sm,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.softCream,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  centerInputArea: {
    flex: 1,
    minHeight: 44,
    backgroundColor: Colors.pureWhite,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  chatTextInput: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.charcoal,
    paddingVertical: 6,
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
    backgroundColor: 'rgba(37, 37, 31, 0.45)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.warmIvory,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.sandBeige,
    ...Shadows.elevated,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
    color: Colors.charcoal,
    marginBottom: Spacing.sm,
  },
  clearChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pureWhite,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  clearChatText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '600',
    color: Colors.error,
  },
});
