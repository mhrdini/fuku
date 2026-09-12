'use client'

import { RuleOutput, RuleUpdateInput } from '@fuku/api/schemas'
import { useTranslation } from '@fuku/i18n/react'
import { Input, ToggleGroup, ToggleGroupItem } from '@fuku/ui/components'

import { useCommittedNumberField } from './use-committed-number-field'

const RuleConstraintEditor = ({
  rule,
  updateRule,
}: {
  rule: RuleOutput
  updateRule: (rule: RuleUpdateInput) => Promise<RuleOutput>
}) => {
  const { t } = useTranslation()

  const penalty = useCommittedNumberField(
    rule.penalty,
    num => updateRule({ ...rule, penalty: num } as RuleUpdateInput),
    { allowNull: true },
  )

  const handleToggleHardConstraint = (hardConstraint: boolean | string) => {
    if (hardConstraint === rule.hardConstraint) return
    if (typeof hardConstraint === 'string') {
      hardConstraint = hardConstraint === 'true'
    }
    updateRule({ ...rule, hardConstraint } as RuleUpdateInput)
  }

  return (
    <>
      {/* hard constraint y/n */}
      <ToggleGroup
        type='single'
        size='sm'
        variant='outline'
        value={String(rule.hardConstraint)}
        onValueChange={handleToggleHardConstraint}
      >
        <ToggleGroupItem
          value='true'
          aria-label={t('toggleHardConstraint', 'Toggle hard constraint')}
        >
          {t('required', 'Required')}
        </ToggleGroupItem>
        <ToggleGroupItem
          value='false'
          aria-label={t('toggleSoftConstraint', 'Toggle soft constraint')}
        >
          {t('preferred', 'Preferred')}
        </ToggleGroupItem>
      </ToggleGroup>
      {/* penalty */}
      <Input
        name='rule-panel-popover-hard-constraint'
        className='w-[8ch]'
        variant='chip'
        placeholder='Penalty'
        value={penalty.input}
        onChange={e => penalty.setInput(e.target.value)}
        onBlur={penalty.commit}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.stopPropagation()
            penalty.commit()
          }
        }}
        disabled={rule.hardConstraint}
      />
    </>
  )
}

export default RuleConstraintEditor
