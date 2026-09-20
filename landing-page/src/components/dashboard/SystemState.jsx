import { createContext, useContext, useEffect, useState } from 'react'
import { useData } from '../../api/data'
import { toDate } from './format'

const Ctx = createContext(null)

export function sameDay(a, b) {
  const d1 = toDate(a); const d2 = toDate(b)
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

export function SystemStateProvider({ children }) {
  const { data } = useData()
  const [employees, setEmployees] = useState([])
  const [empStatus, setEmpStatus] = useState({})
  const [venueStatus, setVenueStatus] = useState({})
  const [assignments, setAssignments] = useState({})

  /* hydrate once from the live API when the gate opens (data arrives with fresh mounts) */
  useEffect(() => {
    if (data.employees.length) setEmployees(data.employees)
    if (data.employees.length) {
      setEmpStatus(Object.fromEntries(data.employees.map(e => [e.Id, e.Status || 'Active'])))
    }
    if (data.venues.length) {
      setVenueStatus(Object.fromEntries(data.venues.map(v => [v.Id, v.Status || 'Available'])))
    }
    if (Object.keys(data.assignments).length) setAssignments(data.assignments)
  }, [data])

  function addEmployee(emp, id) {
    const nextId = id ?? Math.max(0, ...employees.map(e => e.Id)) + 1
    setEmployees(list => [...list, { Id: nextId, Status: 'Active', ...emp }])
    setEmpStatus(s => ({ ...s, [nextId]: 'Active' }))
    return nextId
  }

  const value = {
    employees, addEmployee,
    empStatus, setEmpStatus,
    venueStatus, setVenueStatus,
    assignments, setAssignments,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSystem() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSystem must be used inside <SystemStateProvider>')
  return ctx
}

/* ── availability rules ── */

/* why can't this venue be used for `event`? returns reason string or null */
export function venueUnavailableReason(venue, event, allEvents, venueStatus) {
  if ((venueStatus[venue.Id] || 'Available') !== 'Available') {
    return `Under maintenance${event ? ' on event day' : ''}`
  }
  const conflict = allEvents.find(e =>
    e.Id !== event?.Id &&
    e.VenueId === venue.Id &&
    !['Cancelled', 'Completed'].includes(e.Status) &&
    sameDay(e.StartDate, event.StartDate)
  )
  if (conflict) {
    return `Booked — "${conflict.Name || 'another event'}" is scheduled this day`
  }
  return null
}

/* why can't this employee work `event`? returns reason string or null */
export function employeeUnavailableReason(emp, event, allEvents, assignments, empStatus) {
  if ((empStatus[emp.Id] || emp.Status || 'Active') !== 'Active') {
    return 'On leave / inactive'
  }
  const duty = allEvents.find(e =>
    e.Id !== event?.Id &&
    !['Cancelled', 'Completed'].includes(e.Status) &&
    sameDay(e.StartDate, event.StartDate) &&
    (assignments[e.Id] || []).includes(emp.Id)
  )
  if (duty) {
    return `Already on duty — "${duty.Name || 'another event'}" this day`
  }
  return null
}
