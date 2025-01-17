import dayjs from 'dayjs'
import React from 'react'
import { IEvent, IMode } from '../type'
import { scrollToDate } from '../util'

const Group: React.FC<{
  groupId?: string
  groupName: string
  events: IEvent[]
  milestones?: IEvent[]
  levelCount?: number
  uniqueId?: string
  mode: IMode
}> = ({ groupName, events, milestones = [], mode, levelCount = 0, uniqueId = '' }) => {
  return (
    <div className="group rounded-sm">
      <div className="group__title font-medium sticky bg-quaternary title-text">{groupName}</div>
      <div className="group__content">
        {
          mode === 'simple'
          ? new Array(levelCount).fill(0).map((_, index) => (
            <div className="group__event cursor-pointer"></div>
          ))
          : events.map((event) => (
            <div className="group__event cursor-pointer single_ellipsis" onClick={() => scrollToDate(dayjs(event.start), uniqueId)}>
              {event?.title}
            </div>
          ))
        }
        {
          mode === 'simple'
          ? (milestones?.length > 0 ? <div className="group__event cursor-pointer flex justify-between items-center">{/* Milestones */}</div> : null)
          : milestones?.map((milestone, index) => (
            <div className="group__event cursor-pointer single_ellipsis" onClick={() => scrollToDate(dayjs(milestone.start), uniqueId)}>
              {milestone?.title}
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default Group
