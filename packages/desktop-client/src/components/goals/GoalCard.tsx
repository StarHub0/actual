import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';

import { useBudgetActions } from '#budget';
import { Link } from '#components/common/Link';
import { useFormat } from '#hooks/useFormat';
import { useLocale } from '#hooks/useLocale';
import { SheetNameProvider } from '#hooks/useSheetName';
import { useSheetValue } from '#hooks/useSheetValue';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import { GoalMarkdown } from './GoalMarkdown';
import {
  goalProgress,
  imagePrefKey,
  monthlyNeeded,
  parseChecklist,
} from './goalsModel';
import type { SavingsGoal } from './goalsModel';
import { numeric, Pill, priorityColor, ProgressRing } from './goalsUi';

export type GoalCardProps = {
  goal: SavingsGoal;
  categoryName: string;
  saved: number;
  budgetType: string;
  onEdit: () => void;
  onNotesChange: (notes: string) => void;
};

function GoalImage({ goalId }: { goalId: string }) {
  const [image] = useSyncedPref(imagePrefKey(goalId));
  return (
    <View
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: theme.tableHeaderBackground,
        backgroundImage: image
          ? `url(${image})`
          : `linear-gradient(135deg, ${theme.pageBackgroundTopLeft}, ${theme.pageBackgroundBottomRight})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  );
}

function deadlineLabel(
  deadline: string,
  locale: ReturnType<typeof useLocale>,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const months = monthUtils.differenceInCalendarMonths(
    deadline,
    monthUtils.currentMonth(),
  );
  const date = monthUtils.format(deadline, "MMM ''yy", locale);
  if (months < 0) {
    return { text: t('Overdue · {{date}}', { date }), late: true };
  }
  if (months === 0) return { text: t('This month'), late: false };
  return {
    text: t('{{count}} mo · {{date}}', { count: months, date }),
    late: false,
  };
}

function GoalCardBody({
  goal,
  categoryName,
  saved: balance,
  budgetType,
  onEdit,
  onNotesChange,
}: GoalCardProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const locale = useLocale();
  const [amountText, setAmountText] = useState('');
  const [listOpen, setListOpen] = useState(true);
  const isTracking = budgetType === 'tracking';
  const budgeted =
    useSheetValue<'envelope-budget' | 'tracking-budget', 'budget'>(
      isTracking
        ? trackingBudget.catBudgeted(goal.categoryId)
        : envelopeBudget.catBudgeted(goal.categoryId),
    ) ?? 0;
  const applyBudgetAction = useBudgetActions();

  const progress = goalProgress(balance, goal.target);
  const needed = monthlyNeeded(progress.remaining, goal.deadline);
  const checklist = parseChecklist(goal.notes);
  const hasNotes = !!goal.notes?.trim();
  const priority = goal.priority ?? 'medium';
  const deadline = goal.deadline
    ? deadlineLabel(goal.deadline, locale, t)
    : null;
  const accent = progress.reached ? '#34c77b' : priorityColor[priority];

  function addMoney(cents: number) {
    if (!(cents > 0)) return;
    applyBudgetAction.mutate({
      month: monthUtils.currentMonth(),
      type: 'budget-amount',
      args: { category: goal.categoryId, amount: budgeted + cents },
    });
  }

  function addTyped() {
    addMoney(format.fromEdit(amountText, null) ?? 0);
    setAmountText('');
  }

  return (
    <View
      style={{
        backgroundColor: theme.cardBackground,
        border: `1px solid ${theme.tableBorder}`,
        borderRadius: 18,
        overflow: 'hidden',
        flex: '1 1 340px',
        maxWidth: 460,
        minWidth: 0,
        boxShadow: '0 12px 32px rgba(0,0,0,0.22)',
      }}
    >
      <View style={{ height: 150 }}>
        <GoalImage goalId={goal.id} />
        <View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(to top, rgba(8,10,18,.85), rgba(8,10,18,.05) 65%)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 14,
            right: 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Pill color={accent} solid>
            {progress.reached ? t('Done') : t(priorityText[priority])}
          </Pill>
          {goal.link && (
            <View
              style={{
                padding: '3px 10px',
                borderRadius: 20,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: 'rgba(255,255,255,.2)',
              }}
            >
              <Link variant="external" to={goal.link} linkColor="muted">
                <Trans>Open link</Trans> ↗
              </Link>
            </View>
          )}
        </View>
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
          <Text
            style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}
            data-testid="goal-name"
          >
            {goal.name}
          </Text>
          <Text style={{ fontSize: 12.5, color: 'rgba(255,255,255,.75)' }}>
            {categoryName}
          </Text>
        </View>
      </View>

      <View style={{ padding: 18, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <ProgressRing percent={progress.percent} reached={progress.reached} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={{ fontSize: 12.5, color: theme.pageTextSubdued }}>
              <Trans>Saved</Trans>
            </Text>
            <Text style={{ ...numeric, fontSize: 26, fontWeight: 700 }}>
              {format(progress.saved, 'financial')}
            </Text>
            <Text
              style={{ ...numeric, fontSize: 13, color: theme.pageTextSubdued }}
            >
              {t('of {{target}}', { target: format(goal.target, 'financial') })}
              {!progress.reached &&
                ` · ${t('{{amount}} left', { amount: format(progress.remaining, 'financial') })}`}
            </Text>
          </View>
        </View>

        {(deadline || needed) && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {deadline && (
              <Pill color={deadline.late ? '#f05656' : undefined}>
                {deadline.text}
              </Pill>
            )}
            {needed && (
              <Pill color={theme.pageTextLink}>
                {t('{{amount}} / month', {
                  amount: format(needed.amount, 'financial'),
                })}
              </Pill>
            )}
          </View>
        )}

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input
              value={amountText}
              placeholder={t('Add money')}
              inputMode="decimal"
              onChangeValue={setAmountText}
              onEnter={addTyped}
              style={{ flex: 1, minWidth: 0 }}
              aria-label={t('Add to {{name}}', { name: goal.name })}
            />
            <Button variant="primary" onPress={addTyped}>
              <Trans>Add</Trans>
            </Button>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[5000, 10000, 50000].map(cents => (
              <Button
                key={cents}
                variant="bare"
                onPress={() => addMoney(cents)}
                style={{ ...numeric, fontSize: 12, color: theme.pageTextLink }}
              >
                +{format(cents, 'financial')}
              </Button>
            ))}
          </View>
        </View>

        {hasNotes && (
          <View
            style={{
              gap: 10,
              paddingTop: 14,
              borderTop: `1px solid ${theme.tableBorder}`,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: 600 }}>
                <Trans>List</Trans>
                {checklist.total > 0 && (
                  <span
                    style={{
                      ...numeric,
                      marginLeft: 8,
                      fontWeight: 500,
                      color: theme.pageTextSubdued,
                    }}
                  >
                    {checklist.done}/{checklist.total}
                  </span>
                )}
              </Text>
              <Button variant="bare" onPress={() => setListOpen(!listOpen)}>
                {listOpen ? t('Hide') : t('Show')}
              </Button>
            </View>
            {listOpen && (
              <GoalMarkdown value={goal.notes ?? ''} onChange={onNotesChange} />
            )}
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Button variant="bare" onPress={onEdit} aria-label={t('Edit goal')}>
            <Trans>Edit</Trans>
          </Button>
        </View>
      </View>
    </View>
  );
}

const priorityText = {
  high: 'High priority',
  medium: 'Medium',
  low: 'Low',
} as const;

export function GoalCard(props: GoalCardProps) {
  return (
    <SheetNameProvider
      name={monthUtils.sheetForMonth(monthUtils.currentMonth())}
    >
      <GoalCardBody {...props} />
    </SheetNameProvider>
  );
}
