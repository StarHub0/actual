import React, { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { Page } from '#components/Page';
import { useCategories } from '#hooks/useCategories';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { saveSyncedPrefs } from '#prefs/prefsSlice';
import { useDispatch } from '#redux';

import { GoalCard } from './GoalCard';
import { GoalEditor } from './GoalEditor';
import {
  goalProgress,
  imagePrefKey,
  monthlyNeeded,
  parseGoals,
  priorityOrder,
  serializeGoals,
} from './goalsModel';
import type { SavingsGoal } from './goalsModel';
import { GoalsSummary } from './GoalsSummary';
import { Segment } from './goalsUi';
import { useGoalBalances } from './useGoalBalances';

type Filter = 'all' | 'active' | 'done';
type Sort = 'priority' | 'deadline' | 'progress';

export function GoalsPage() {
  const { t } = useTranslation();
  const { data: categoryData } = useCategories();
  const [rawGoals, setRawGoals] = useSyncedPref('savings-goals');
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');
  const dispatch = useDispatch();
  const goals = useMemo(() => parseGoals(rawGoals), [rawGoals]);
  const [editing, setEditing] = useState<SavingsGoal | 'new' | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('priority');
  const balances = useGoalBalances(
    goals.map(goal => goal.categoryId),
    budgetType,
  );

  const expenseCategories = useMemo(
    () => (categoryData?.list ?? []).filter(c => !c.is_income && !c.hidden),
    [categoryData],
  );
  const categoryName = (id: string) =>
    categoryData?.list.find(c => c.id === id)?.name ?? t('Unknown category');

  const rows = goals.map(goal => {
    const progress = goalProgress(balances[goal.categoryId] ?? 0, goal.target);
    return {
      goal,
      progress,
      needed: monthlyNeeded(progress.remaining, goal.deadline)?.amount ?? 0,
    };
  });
  const totals = {
    saved: rows.reduce(
      (sum, row) => sum + Math.min(row.progress.saved, row.goal.target),
      0,
    ),
    target: rows.reduce((sum, row) => sum + row.goal.target, 0),
    monthly: rows.reduce((sum, row) => sum + row.needed, 0),
    reached: rows.filter(row => row.progress.reached).length,
  };

  const visible = rows
    .filter(row =>
      filter === 'all'
        ? true
        : filter === 'done'
          ? row.progress.reached
          : !row.progress.reached,
    )
    .sort((a, b) => {
      if (sort === 'deadline') {
        return (a.goal.deadline ?? '9999').localeCompare(
          b.goal.deadline ?? '9999',
        );
      }
      if (sort === 'progress') return b.progress.percent - a.progress.percent;
      return (
        priorityOrder[a.goal.priority ?? 'medium'] -
        priorityOrder[b.goal.priority ?? 'medium']
      );
    });

  const saveImage = (goalId: string, image: string) =>
    void dispatch(
      saveSyncedPrefs({ prefs: { [imagePrefKey(goalId)]: image } }),
    );

  function saveGoal(goal: SavingsGoal, image: string | null | undefined) {
    const exists = goals.some(g => g.id === goal.id);
    setRawGoals(
      serializeGoals(
        exists
          ? goals.map(g => (g.id === goal.id ? goal : g))
          : [...goals, goal],
      ),
    );
    if (image) saveImage(goal.id, image);
    setEditing(null);
  }

  function deleteGoal(goal: SavingsGoal) {
    setRawGoals(serializeGoals(goals.filter(g => g.id !== goal.id)));
    saveImage(goal.id, '');
    setEditing(null);
  }

  function updateNotes(goal: SavingsGoal, notes: string) {
    setRawGoals(
      serializeGoals(goals.map(g => (g.id === goal.id ? { ...g, notes } : g))),
    );
  }

  return (
    <Page header={t('Goals')} padding={20}>
      <View style={{ gap: 22, maxWidth: 1400 }}>
        {goals.length > 0 && (
          <GoalsSummary
            saved={totals.saved}
            target={totals.target}
            monthly={totals.monthly}
            reached={totals.reached}
            count={goals.length}
          />
        )}

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Segment
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: t('All') },
                { value: 'active', label: t('In progress') },
                { value: 'done', label: t('Done') },
              ]}
            />
            <Segment
              value={sort}
              onChange={setSort}
              options={[
                { value: 'priority', label: t('Priority') },
                { value: 'deadline', label: t('Deadline') },
                { value: 'progress', label: t('Progress') },
              ]}
            />
          </View>
          <Button variant="primary" onPress={() => setEditing('new')}>
            <Trans>New goal</Trans>
          </Button>
        </View>

        {goals.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              gap: 10,
              padding: '60px 20px',
              borderRadius: 18,
              border: `1px dashed ${theme.tableBorder}`,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 600 }}>
              <Trans>No goals yet</Trans>
            </Text>
            <Text style={{ color: theme.pageTextSubdued }}>
              <Trans>Add a price, a deadline and a checklist.</Trans>
            </Text>
            <Button variant="primary" onPress={() => setEditing('new')}>
              <Trans>New goal</Trans>
            </Button>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
            {visible.map(({ goal }) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                categoryName={categoryName(goal.categoryId)}
                saved={balances[goal.categoryId] ?? 0}
                budgetType={budgetType}
                onEdit={() => setEditing(goal)}
                onNotesChange={notes => updateNotes(goal, notes)}
              />
            ))}
          </View>
        )}
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
    </Page>
  );
}
