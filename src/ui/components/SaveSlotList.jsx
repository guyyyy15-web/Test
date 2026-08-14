import { getClass } from '../../data/classes.js'
import { formatPlaytime } from '../../engine/game.js'
import { listSlots } from '../save/slots.js'
import MenuList from './MenuList.jsx'
import Window from './Window.jsx'

/**
 * The three save slots, shared by the town's Save menu and the title screen's
 * Continue. Each row shows what a JRPG slot has always shown: who is in the
 * party, how far they got, and how long it took.
 */

function SlotSummary({ entry }) {
  if (entry.empty) return <span className="u-dim">- empty -</span>
  if (entry.corrupt) return <span className="u-danger">unreadable</span>

  const { summary } = entry
  return (
    <span className="save-slot">
      <span className="save-slot__party">
        {summary.party.map((member) => (
          <span key={member.name} className="save-slot__member">
            {getClass(member.classId).tag} {member.name} {member.level}
          </span>
        ))}
      </span>
      <span className="save-slot__meta">
        {formatPlaytime(summary.playtimeMs)} &middot; {summary.gold} G
      </span>
    </span>
  )
}

export function SaveSlotList({ action, onPick, onCancel, notice }) {
  const slots = listSlots()

  const items = slots.map((entry) => ({
    key: String(entry.slot),
    label: (
      <span className="save-slot__row">
        <strong>Slot {entry.slot}</strong>
        <SlotSummary entry={entry} />
      </span>
    ),
    // You can always write to a slot; you can only read one with data in it.
    disabled: action === 'load' && (entry.empty || entry.corrupt),
  }))

  return (
    <Window title={action === 'save' ? 'Save to which slot?' : 'Load which slot?'}>
      {notice ? <p className="u-accent">{notice}</p> : null}
      <MenuList
        items={items}
        onSelect={(item) => onPick(Number(item.key))}
        onCancel={onCancel}
        ariaLabel="Save slots"
      />
      <button type="button" className="button" onClick={onCancel}>
        Back
      </button>
    </Window>
  )
}

export default SaveSlotList
