export const AndroidImportance = { HIGH: 'HIGH' }
export const SchedulableTriggerInputTypes = { DAILY: 'daily' }

export const setNotificationHandler = jest.fn()
export const getPermissionsAsync = jest.fn().mockResolvedValue({ status: 'undetermined' })
export const requestPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' })
export const setNotificationChannelAsync = jest.fn().mockResolvedValue(undefined)
export const scheduleNotificationAsync = jest.fn().mockResolvedValue('notif-id-123')
export const getAllScheduledNotificationsAsync = jest.fn().mockResolvedValue([])
export const cancelScheduledNotificationAsync = jest.fn().mockResolvedValue(undefined)
