import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { CategoryEntity } from '@actual-app/core/types/models';

import { useFormat } from '#hooks/useFormat';
import { useSyncedPref } from '#hooks/useSyncedPref';

import { GoalMarkdown } from './GoalMarkdown';
import { imagePrefKey, newGoalId, readImageAsThumbnail } from './goalsModel';
import type { GoalPriority, SavingsGoal } from './goalsModel';
import { Segment } from './goalsUi';

const fieldLabel = { fontSize: 12.5, color: theme.pageTextSubdued } as const;

function Field({
  label,
  children,
  flex,
}: {
  label: ReactNode;
  children: ReactNode;
  flex?: number;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex }}>
      <Text style={fieldLabel}>{label}</Text>
      {children}
    </label>
  );
}

const starter = `### Things I need

- [ ] First item
- [ ] Second item

> Notes, links and prices go here. **Markdown** works.
`;

export function GoalEditor({
  initial,
  categories,
  onSave,
  onDelete,
  onCancel,
}: {
  initial: SavingsGoal | null;
  categories: CategoryEntity[];
  onSave: (goal: SavingsGoal, image: string | null | undefined) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const format = useFormat();
  const [storedImage] = useSyncedPref(imagePrefKey(initial?.id ?? 'new'));
  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? categories[0]?.id ?? '',
  );
  const [targetText, setTargetText] = useState(
    initial ? format.forEdit(initial.target) : '',
  );
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');
  const [priority, setPriority] = useState<GoalPriority>(
    initial?.priority ?? 'medium',
  );
  const [link, setLink] = useState(initial?.link ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [image, setImage] = useState<string | null | undefined>(undefined);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const target = format.fromEdit(targetText, null);
  const canSave = name.trim() !== '' && categoryId !== '' && !!target;
  const shownImage = image === undefined ? storedImage : image;

  async function pickImage(file: File | undefined) {
    if (file) setImage(await readImageAsThumbnail(file));
  }

  function insert(snippet: string) {
    setNotes(
      current =>
        `${current}${current && !current.endsWith('\n') ? '\n' : ''}${snippet}`,
    );
    setTab('write');
    notesRef.current?.focus();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(5,7,12,.7)',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto',
        padding: 20,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          backgroundColor: theme.cardBackground,
          border: `1px solid ${theme.tableBorder}`,
          borderRadius: 20,
          width: '100%',
          maxWidth: 980,
          margin: '4vh 0',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,.5)',
        }}
      >
        <View
          style={{
            height: 150,
            backgroundColor: theme.tableHeaderBackground,
            backgroundImage: shownImage
              ? `linear-gradient(to top, rgba(8,10,18,.7), rgba(8,10,18,0) 60%), url(${shownImage})`
              : `linear-gradient(135deg, ${theme.pageBackgroundTopLeft}, ${theme.pageBackgroundBottomRight})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            justifyContent: 'flex-end',
            padding: 18,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
              {name || (initial ? t('Edit goal') : t('New goal'))}
            </Text>
            <label
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#fff',
                padding: '6px 14px',
                borderRadius: 20,
                cursor: 'pointer',
                backgroundColor: 'rgba(255,255,255,.2)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Trans>Change image</Trans>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => void pickImage(e.target.files?.[0])}
              />
            </label>
          </View>
        </View>

        <View
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
            padding: 22,
          }}
        >
          <View style={{ gap: 16, minWidth: 0 }}>
            <Field label={t('Name')}>
              <Input value={name} onChangeValue={setName} />
            </Field>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Field label={t('Price')} flex={1}>
                <Input
                  value={targetText}
                  inputMode="decimal"
                  placeholder="0,00"
                  onChangeValue={setTargetText}
                />
              </Field>
              <Field label={t('Deadline')} flex={1}>
                <Input
                  type="month"
                  value={deadline}
                  onChangeValue={setDeadline}
                />
              </Field>
            </View>
            <Field label={t('Category')}>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  background: theme.formInputBackground,
                  color: theme.formInputText,
                  border: `1px solid ${theme.formInputBorder}`,
                }}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('Priority')}>
              <Segment
                value={priority}
                onChange={setPriority}
                options={[
                  { value: 'high', label: t('High') },
                  { value: 'medium', label: t('Medium') },
                  { value: 'low', label: t('Low') },
                ]}
              />
            </Field>
            <Field label={t('Link (store, listing)')}>
              <Input
                value={link}
                placeholder="https://"
                onChangeValue={setLink}
              />
            </Field>
          </View>

          <View style={{ gap: 10, minWidth: 0 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <Text style={fieldLabel}>
                <Trans>List and notes (markdown)</Trans>
              </Text>
              <Segment
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'write', label: t('Write') },
                  { value: 'preview', label: t('Preview') },
                ]}
              />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Button variant="bare" onPress={() => insert('- [ ] ')}>
                {t('+ Item')}
              </Button>
              <Button variant="bare" onPress={() => insert('### ')}>
                {t('+ Heading')}
              </Button>
              <Button variant="bare" onPress={() => insert('> ')}>
                {t('+ Note')}
              </Button>
              <Button variant="bare" onPress={() => setNotes(starter)}>
                <Trans>Template</Trans>
              </Button>
            </View>
            {tab === 'write' ? (
              <textarea
                ref={notesRef}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={'- [ ] Item one — R$ 100\n- [ ] Item two'}
                style={{
                  minHeight: 260,
                  resize: 'vertical',
                  padding: 12,
                  borderRadius: 10,
                  fontSize: 14,
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                  color: theme.formInputText,
                  backgroundColor: theme.formInputBackground,
                  border: `1px solid ${theme.formInputBorder}`,
                }}
              />
            ) : (
              <View
                style={{
                  minHeight: 260,
                  padding: 12,
                  borderRadius: 10,
                  border: `1px solid ${theme.tableBorder}`,
                }}
              >
                {notes.trim() ? (
                  <GoalMarkdown
                    value={notes}
                    onChange={next => setNotes(next)}
                  />
                ) : (
                  <Text style={{ color: theme.pageTextSubdued }}>
                    <Trans>Nothing to preview</Trans>
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            justifyContent: 'flex-end',
            padding: '14px 22px',
            borderTop: `1px solid ${theme.tableBorder}`,
          }}
        >
          {onDelete && (
            <Button onPress={onDelete} style={{ marginRight: 'auto' }}>
              <Trans>Delete</Trans>
            </Button>
          )}
          <Button onPress={onCancel}>
            <Trans>Cancel</Trans>
          </Button>
          <Button
            variant="primary"
            isDisabled={!canSave}
            onPress={() =>
              onSave(
                {
                  id: initial?.id ?? newGoalId(),
                  categoryId,
                  name: name.trim(),
                  target: target ?? 0,
                  deadline: deadline || null,
                  priority,
                  link: link.trim() || undefined,
                  notes: notes.trim() ? notes : undefined,
                },
                image,
              )
            }
          >
            <Trans>Save</Trans>
          </Button>
        </View>
      </View>
    </div>
  );
}
