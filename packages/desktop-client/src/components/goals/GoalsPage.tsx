import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import type { CategoryEntity } from '@actual-app/core/types/models';

import { useBudgetActions } from '#budget';
import { Page } from '#components/Page';
import { useCategories } from '#hooks/useCategories';
import { useFormat } from '#hooks/useFormat';
import { useLocale } from '#hooks/useLocale';
import { SheetNameProvider } from '#hooks/useSheetName';
import { useSheetValue } from '#hooks/useSheetValue';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { saveSyncedPrefs } from '#prefs/prefsSlice';
import { useDispatch } from '#redux';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import {
  goalProgress,
  imagePrefKey,
  monthlyNeeded,
  newGoalId,
  parseGoals,
  readImageAsThumbnail,
  serializeGoals,
} from './goalsModel';
import type { SavingsGoal } from './goalsModel';

const accent = theme.pageTextLink;

function GoalImage({ goalId, height }: { goalId: string; height: number }) {
  const [image] = useSyncedPref(imagePrefKey(goalId));
  return (
    <View
      style={{
        height,
        backgroundColor: theme.tableHeaderBackground,
        backgroundImage: image
          ? `linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0) 60%), url(${image})`
          : `linear-gradient(135deg, ${theme.pageBackgroundTopLeft}, ${theme.pageBackgroundBottomRight})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  );
}

type GoalCardProps = {
  goal: SavingsGoal;
  categoryName: string;
  budgetType: string;
  onEdit: () => void;
};

function GoalCardBody({
  goal,
  categoryName,
  budgetType,
  onEdit,
}: GoalCardProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const locale = useLocale();
  const currentMonth = monthUtils.currentMonth();
  const isTracking = budgetType === 'tracking';
  const balance =
    useSheetValue<'envelope-budget' | 'tracking-budget', 'leftover'>(
      isTracking
        ? trackingBudget.catBalance(goal.categoryId)
        : envelopeBudget.catBalance(goal.categoryId),
    ) ?? 0;
  const budgeted =
    useSheetValue<'envelope-budget' | 'tracking-budget', 'budget'>(
      isTracking
        ? trackingBudget.catBudgeted(goal.categoryId)
        : envelopeBudget.catBudgeted(goal.categoryId),
    ) ?? 0;
  const applyBudgetAction = useBudgetActions();
  const [amountText, setAmountText] = useState('');

  const progress = goalProgress(balance, goal.target);
  const needed = monthlyNeeded(progress.remaining, goal.deadline);

  function addMoney() {
    const amount = format.fromEdit(amountText, null);
    if (amount == null || amount <= 0) return;
    applyBudgetAction.mutate({
      month: currentMonth,
      type: 'budget-amount',
      args: { category: goal.categoryId, amount: budgeted + amount },
    });
    setAmountText('');
  }

  return (
    <View
      style={{
        backgroundColor: theme.cardBackground,
        border: `1px solid ${theme.tableBorder}`,
        borderRadius: 16,
        overflow: 'hidden',
        minWidth: 280,
        flex: '1 1 300px',
        maxWidth: 420,
      }}
    >
      <View>
        <GoalImage goalId={goal.id} height={150} />
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <View>
            <Text
              style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}
              data-testid="goal-name"
            >
              {goal.name}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              {categoryName}
            </Text>
          </View>
          {progress.reached && (
            <Text
              style={{
                backgroundColor: theme.noticeBackgroundDark,
                color: '#fff',
                borderRadius: 20,
                padding: '2px 10px',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {t('Done')}
            </Text>
          )}
        </View>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: 600 }}>
            {format(progress.saved, 'financial')}
          </Text>
          <Text style={{ color: theme.pageTextSubdued }}>
            {t('of {{target}}', { target: format(goal.target, 'financial') })}
          </Text>
        </View>

        <View
          style={{
            height: 10,
            borderRadius: 10,
            backgroundColor: theme.tableBorder,
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={Math.round(progress.percent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <View
            style={{
              height: '100%',
              width: `${progress.percent}%`,
              borderRadius: 10,
              backgroundColor: progress.reached
                ? theme.noticeBackgroundDark
                : accent,
              transition: 'width .4s',
            }}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            color: theme.pageTextSubdued,
            fontSize: 13,
          }}
        >
          <Text>{Math.round(progress.percent)}%</Text>
          <Text>
            {progress.reached
              ? ''
              : t('{{amount}} left', {
                  amount: format(progress.remaining, 'financial'),
                })}
          </Text>
        </View>

        {goal.deadline && (
          <Text style={{ fontSize: 13, color: theme.pageTextLight }}>
            {t('By {{date}}', {
              date: monthUtils.format(goal.deadline, "MMM ''yy", locale),
            })}
            {needed
              ? ` · ${t('{{amount}} per month', { amount: format(needed.amount, 'financial') })}`
              : ''}
          </Text>
        )}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <Input
            value={amountText}
            placeholder={t('Amount')}
            inputMode="decimal"
            onChangeValue={setAmountText}
            onEnter={addMoney}
            style={{ flex: 1 }}
            aria-label={t('Add to {{name}}', { name: goal.name })}
          />
          <Button variant="primary" onPress={addMoney}>
            {t('Add')}
          </Button>
          <Button onPress={onEdit} aria-label={t('Edit goal')}>
            {t('Edit')}
          </Button>
        </View>
      </View>
    </View>
  );
}

function GoalCard(props: GoalCardProps) {
  return (
    <SheetNameProvider name={monthUtils.sheetForMonth(monthUtils.currentMonth())}>
      <GoalCardBody {...props} />
    </SheetNameProvider>
  );
}

type GoalEditorProps = {
  initial: SavingsGoal | null;
  categories: CategoryEntity[];
  onSave: (goal: SavingsGoal, image: string | null | undefined) => void;
  onDelete?: () => void;
  onCancel: () => void;
};

function GoalEditor({
  initial,
  categories,
  onSave,
  onDelete,
  onCancel,
}: GoalEditorProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? categories[0]?.id ?? '',
  );
  const [targetText, setTargetText] = useState(
    initial ? format.forEdit(initial.target) : '',
  );
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');
  const [image, setImage] = useState<string | null | undefined>(undefined);
  const [previewKey] = useState(initial?.id ?? 'new');
  const target = format.fromEdit(targetText, null);
  const canSave = name.trim() !== '' && categoryId !== '' && !!target;

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    setImage(await readImageAsThumbnail(file));
  }

  return (
    <View
      style={{
        backgroundColor: theme.cardBackground,
        border: `1px solid ${theme.tableBorder}`,
        borderRadius: 16,
        padding: 20,
        gap: 14,
        maxWidth: 520,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: 600 }}>
        {initial ? t('Edit goal') : t('New goal')}
      </Text>
      <View
        style={{
          height: 140,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: theme.tableHeaderBackground,
          backgroundImage: image ? `url(${image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!image && initial && image === undefined && (
          <GoalImage goalId={previewKey} height={140} />
        )}
      </View>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Text>{t('Image')}</Text>
        <input
          type="file"
          accept="image/*"
          onChange={e => void onPickImage(e.target.files?.[0])}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Text>{t('Name')}</Text>
        <Input value={name} onChangeValue={setName} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Text>{t('Category')}</Text>
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
      </label>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <label
          style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}
        >
          <Text>{t('Target amount')}</Text>
          <Input
            value={targetText}
            inputMode="decimal"
            onChangeValue={setTargetText}
          />
        </label>
        <label
          style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}
        >
          <Text>{t('Deadline')}</Text>
          <Input
            type="month"
            value={deadline}
            onChangeValue={setDeadline}
          />
        </label>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
        {onDelete && (
          <Button onPress={onDelete} style={{ marginRight: 'auto' }}>
            {t('Delete')}
          </Button>
        )}
        <Button onPress={onCancel}>{t('Cancel')}</Button>
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
              },
              image,
            )
          }
        >
          {t('Save')}
        </Button>
      </View>
    </View>
  );
}

export function GoalsPage() {
  const { t } = useTranslation();
  const { data: categoryData } = useCategories();
  const [rawGoals, setRawGoals] = useSyncedPref('savings-goals');
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');
  const dispatch = useDispatch();
  const goals = useMemo(() => parseGoals(rawGoals), [rawGoals]);
  const [editing, setEditing] = useState<SavingsGoal | 'new' | null>(null);
  const imageSaver = (goalId: string, image: string) =>
    void dispatch(
      saveSyncedPrefs({ prefs: { [imagePrefKey(goalId)]: image } }),
    );

  const expenseCategories = useMemo(
    () => (categoryData?.list ?? []).filter(c => !c.is_income && !c.hidden),
    [categoryData],
  );
  const categoryName = (id: string) =>
    categoryData?.list.find(c => c.id === id)?.name ?? t('Unknown category');

  function saveGoal(goal: SavingsGoal, image: string | null | undefined) {
    const exists = goals.some(g => g.id === goal.id);
    const next = exists
      ? goals.map(g => (g.id === goal.id ? goal : g))
      : [...goals, goal];
    setRawGoals(serializeGoals(next));
    if (image) imageSaver(goal.id, image);
    setEditing(null);
  }

  function deleteGoal(goal: SavingsGoal) {
    setRawGoals(serializeGoals(goals.filter(g => g.id !== goal.id)));
    imageSaver(goal.id, '');
    setEditing(null);
  }

  return (
    <Page header={t('Goals')} padding={20}>
      <View style={{ gap: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Button variant="primary" onPress={() => setEditing('new')}>
            {t('New goal')}
          </Button>
        </View>

        {editing && (
          <GoalEditor
            initial={editing === 'new' ? null : editing}
            categories={expenseCategories}
            onSave={saveGoal}
            onDelete={editing === 'new' ? undefined : () => deleteGoal(editing)}
            onCancel={() => setEditing(null)}
          />
        )}

        {goals.length === 0 && !editing ? (
          <Text style={{ color: theme.pageTextSubdued }}>
            {t('No goals')}
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                categoryName={categoryName(goal.categoryId)}
                budgetType={budgetType}
                onEdit={() => setEditing(goal)}
              />
            ))}
          </View>
        )}
      </View>
    </Page>
  );
}
