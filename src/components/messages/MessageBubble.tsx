import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Image, Linking} from 'react-native';
import {
  Check,
  CheckCheck,
  File as FileIcon,
  Play,
  Mic,
  Reply,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react-native';
import {colors} from '../../theme/colors';
import {formatTime} from '../../utils/formatters';
import type {Message, UserSnippet} from '../../types/messaging.types';

// Image with error fallback
function ImageAttachment({url, name, isMine, hasContent, onPress}: {
  url: string; name?: string; isMine: boolean; hasContent: boolean; onPress: () => void;
}) {
  const [failed, setFailed] = useState(false);
  if (failed || !url) {
    return (
      <TouchableOpacity onPress={onPress} style={{
        width: 220, height: 80, borderRadius: 12, backgroundColor: colors.muted,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
        marginBottom: hasContent ? 6 : 0,
      }}>
        <ImageIcon size={20} color={isMine ? 'rgba(255,255,255,0.6)' : colors.mutedForeground} />
        <Text style={{fontSize: 12, color: isMine ? 'rgba(255,255,255,0.6)' : colors.mutedForeground}}>
          {name || 'Image'}
        </Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}
      style={{marginBottom: hasContent ? 6 : 0}}>
      <Image
        source={{uri: url}}
        style={{width: 220, height: 160, borderRadius: 12, backgroundColor: colors.muted}}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    </TouchableOpacity>
  );
}

interface Props {
  message: Message;
  isMine: boolean;
  onImagePress?: (url: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (message: Message) => void;
}

export default function MessageBubble({
  message,
  isMine,
  onImagePress,
  onDelete,
  onReply,
}: Props) {
  if (message.is_deleted) {
    return (
      <View
        style={{
          alignSelf: isMine ? 'flex-end' : 'flex-start',
          marginHorizontal: 12,
          marginVertical: 2,
          backgroundColor: colors.muted,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}>
        <Text style={{fontSize: 13, color: colors.mutedForeground, fontStyle: 'italic'}}>
          Message deleted
        </Text>
      </View>
    );
  }

  if (message.type === 'system') {
    return (
      <View style={{alignItems: 'center', marginVertical: 8, paddingHorizontal: 40}}>
        <Text style={{fontSize: 11, color: colors.mutedForeground, textAlign: 'center'}}>
          {message.content}
        </Text>
      </View>
    );
  }

  const replyTo = message.reply_to as Message | undefined;
  const replySender = replyTo?.sender as UserSnippet | undefined;

  const renderReadStatus = () => {
    const {status} = message;
    if (!isMine) return null;
    if (status.read_at) {
      return <CheckCheck size={14} color={colors.primary} />;
    }
    if (status.delivered_at) {
      return <CheckCheck size={14} color={colors.mutedForeground} />;
    }
    return <Check size={14} color={colors.mutedForeground} />;
  };

  const renderAttachment = () => {
    const att = message.attachments?.[0];
    if (!att) return null;

    if (message.type === 'image') {
      return (
        <ImageAttachment
          url={att.url}
          name={att.original_name}
          isMine={isMine}
          hasContent={!!message.content}
          onPress={() => onImagePress?.(att.url)}
        />
      );
    }

    if (message.type === 'voice_note') {
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: message.content ? 6 : 0,
          }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : `${colors.primary}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Mic size={16} color={isMine ? colors.white : colors.primary} />
          </View>
          <View style={{flex: 1}}>
            <View
              style={{
                height: 4,
                backgroundColor: isMine ? 'rgba(255,255,255,0.3)' : colors.border,
                borderRadius: 2,
              }}
            />
          </View>
          {att.duration_seconds ? (
            <Text
              style={{
                fontSize: 11,
                color: isMine ? 'rgba(255,255,255,0.7)' : colors.mutedForeground,
              }}>
              {Math.floor(att.duration_seconds / 60)}:
              {String(Math.floor(att.duration_seconds % 60)).padStart(2, '0')}
            </Text>
          ) : null}
        </View>
      );
    }

    if (message.type === 'video') {
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => att.url && Linking.openURL(att.url)}
          style={{
            marginBottom: message.content ? 6 : 0,
            position: 'relative',
          }}>
          {att.thumbnail_url ? (
            <Image
              source={{uri: att.thumbnail_url}}
              style={{width: 220, height: 140, borderRadius: 12, backgroundColor: colors.muted}}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 220,
                height: 140,
                borderRadius: 12,
                backgroundColor: colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Play size={32} color={colors.mutedForeground} />
            </View>
          )}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(0,0,0,0.5)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Play size={20} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // File / Document — show thumbnail preview if available
    const ext = att.original_name?.split('.').pop()?.toUpperCase() || 'FILE';
    if (att.thumbnail_url) {
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => att.url && Linking.openURL(att.url)}
          style={{marginBottom: message.content ? 6 : 0, position: 'relative'}}>
          <Image
            source={{uri: att.thumbnail_url}}
            style={{width: 220, height: 160, borderRadius: 12, backgroundColor: colors.muted}}
            resizeMode="cover"
          />
          {/* Badge */}
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}>
            <Text style={{fontSize: 10, fontWeight: '700', color: '#fff'}}>{ext}</Text>
          </View>
          {/* Bottom bar with name + size */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.55)',
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}>
            <Text numberOfLines={1} style={{fontSize: 11, fontWeight: '600', color: '#fff'}}>
              {att.original_name}
            </Text>
            <Text style={{fontSize: 9, color: 'rgba(255,255,255,0.7)'}}>
              {att.size_bytes >= 1048576
                ? `${(att.size_bytes / 1048576).toFixed(1)} MB`
                : `${(att.size_bytes / 1024).toFixed(0)} KB`}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // No thumbnail — icon card
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => att.url && Linking.openURL(att.url)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: 8,
          backgroundColor: isMine ? 'rgba(255,255,255,0.1)' : `${colors.primary}08`,
          borderRadius: 10,
          marginBottom: message.content ? 6 : 0,
        }}>
        <FileIcon size={20} color={isMine ? colors.white : colors.primary} />
        <View style={{flex: 1}}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: isMine ? colors.white : colors.foreground,
            }}>
            {att.original_name}
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: isMine ? 'rgba(255,255,255,0.6)' : colors.mutedForeground,
            }}>
            {att.size_bytes >= 1048576
              ? `${(att.size_bytes / 1048576).toFixed(1)} MB`
              : `${(att.size_bytes / 1024).toFixed(0)} KB`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLinkPreview = () => {
    const preview = message.link_previews?.[0];
    if (!preview) return null;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => Linking.openURL(preview.url)}
        style={{
          borderLeftWidth: 3,
          borderLeftColor: isMine ? 'rgba(255,255,255,0.4)' : colors.primary,
          paddingLeft: 8,
          marginTop: 6,
        }}>
        {preview.image ? (
          <Image
            source={{uri: preview.image}}
            style={{
              width: '100%',
              height: 100,
              borderRadius: 8,
              marginBottom: 4,
              backgroundColor: colors.muted,
            }}
            resizeMode="cover"
          />
        ) : null}
        {preview.title ? (
          <Text
            numberOfLines={2}
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: isMine ? colors.white : colors.foreground,
            }}>
            {preview.title}
          </Text>
        ) : null}
        {preview.description ? (
          <Text
            numberOfLines={2}
            style={{
              fontSize: 11,
              color: isMine ? 'rgba(255,255,255,0.7)' : colors.mutedForeground,
              marginTop: 1,
            }}>
            {preview.description}
          </Text>
        ) : null}
        <Text
          style={{
            fontSize: 10,
            color: isMine ? 'rgba(255,255,255,0.5)' : colors.mutedForeground,
            marginTop: 2,
          }}>
          {preview.domain || preview.site_name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        maxWidth: '78%',
        marginHorizontal: 12,
        marginVertical: 2,
      }}>
      <View
        style={{
          backgroundColor: isMine ? colors.primary : colors.card,
          borderRadius: 18,
          borderBottomRightRadius: isMine ? 4 : 18,
          borderBottomLeftRadius: isMine ? 18 : 4,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderWidth: isMine ? 0 : 1,
          borderColor: colors.border,
        }}>
        {/* Reply reference */}
        {replyTo && (
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: isMine ? 'rgba(255,255,255,0.4)' : colors.accent,
              paddingLeft: 8,
              marginBottom: 6,
            }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: isMine ? 'rgba(255,255,255,0.7)' : colors.accent,
              }}>
              {replySender?.profile?.first_name || 'User'}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                color: isMine ? 'rgba(255,255,255,0.6)' : colors.mutedForeground,
              }}>
              {replyTo.content || (replyTo.type !== 'text' ? replyTo.type : '')}
            </Text>
          </View>
        )}

        {renderAttachment()}

        {message.content ? (
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: isMine ? colors.white : colors.foreground,
            }}>
            {message.content}
          </Text>
        ) : null}

        {renderLinkPreview()}

        {/* Timestamp + read status */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            marginTop: 4,
          }}>
          <Text
            style={{
              fontSize: 10,
              color: isMine ? 'rgba(255,255,255,0.6)' : colors.mutedForeground,
            }}>
            {formatTime(message.created_at)}
          </Text>
          {renderReadStatus()}
        </View>
      </View>

      {/* Quick actions */}
      {(onReply || (isMine && onDelete)) && (
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginTop: 2,
            justifyContent: isMine ? 'flex-end' : 'flex-start',
            paddingHorizontal: 4,
          }}>
          {onReply && (
            <TouchableOpacity
              hitSlop={8}
              onPress={() => onReply(message)}>
              <Reply size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          {isMine && onDelete && (
            <TouchableOpacity
              hitSlop={8}
              onPress={() => onDelete(message._id)}>
              <Trash2 size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
