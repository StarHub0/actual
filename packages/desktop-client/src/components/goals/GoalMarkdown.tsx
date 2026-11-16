import { Children, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';

import { theme } from '@actual-app/components/theme';
import { css } from '@emotion/css';
import rehypeExternalLinks from 'rehype-external-links';
import remarkGfm from 'remark-gfm';

import { markdownBaseStyles } from '#util/markdown';

import { toggleChecklistItem } from './goalsModel';

const styles = css(markdownBaseStyles, {
  fontSize: 14,
  lineHeight: 1.55,
  color: theme.pageText,
  '& h1, & h2, & h3': {
    margin: '14px 0 6px',
    fontWeight: 600,
    lineHeight: 1.25,
  },
  '& h1': { fontSize: 18 },
  '& h2': { fontSize: 16 },
  '& h3': { fontSize: 14, color: theme.pageTextSubdued },
  '& ul, & ol': { margin: '4px 0', paddingLeft: 22 },
  '& ul.contains-task-list': { listStyle: 'none', paddingLeft: 0 },
  '& li.task-list-item': {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '6px 10px',
    margin: '3px 0',
    borderRadius: 8,
    backgroundColor: theme.tableRowHeaderBackground,
  },
  '& li.task-list-item input': {
    marginTop: 3,
    width: 16,
    height: 16,
    flexShrink: 0,
    cursor: 'pointer',
    accentColor: theme.pageTextLink,
  },
  '& li.task-list-item.done': {
    color: theme.pageTextSubdued,
    textDecoration: 'line-through',
  },
  '& blockquote': {
    margin: '8px 0',
    padding: '6px 12px',
    borderLeft: `3px solid ${theme.pageTextLink}`,
    color: theme.pageTextSubdued,
    backgroundColor: theme.tableRowHeaderBackground,
    borderRadius: '0 8px 8px 0',
  },
  '& code': {
    padding: '1px 6px',
    borderRadius: 4,
    backgroundColor: theme.tableRowHeaderBackground,
    fontSize: 13,
  },
  '& a': { color: theme.pageTextLink },
  '& hr': {
    border: 'none',
    borderTop: `1px solid ${theme.tableBorder}`,
    margin: '12px 0',
  },
  '& table': { borderCollapse: 'collapse', margin: '8px 0' },
  '& th, & td': {
    border: `1px solid ${theme.tableBorder}`,
    padding: '4px 10px',
  },
  '& strong': { fontWeight: 600 },
});

function countTasks(text: string) {
  return [...text.matchAll(/^\s*[-*+]\s+\[( |x|X)\]/gm)].length;
}

export function GoalMarkdown({
  value,
  onChange,
}: {
  value: string;
  onChange?: (next: string) => void;
}) {
  return (
    <div className={styles}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}
        components={{
          li: ({ className, children, ...rest }) => {
            const isTask = className?.includes('task-list-item');
            let checked = false;
            if (isTask) {
              Children.forEach(children, child => {
                if (
                  isValidElement<{ checked?: boolean }>(child) &&
                  child.props.checked
                ) {
                  checked = true;
                }
              });
            }
            return (
              <li
                {...rest}
                className={`${className ?? ''}${checked ? ' done' : ''}`}
              >
                {children}
              </li>
            );
          },
          input: ({ type, checked, node }) => {
            if (type !== 'checkbox') return null;
            const offset = node?.position?.start.offset ?? 0;
            const index = countTasks(value.slice(0, offset));
            return (
              <input
                type="checkbox"
                checked={checked}
                disabled={!onChange}
                onChange={() => onChange?.(toggleChecklistItem(value, index))}
              />
            );
          },
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}
