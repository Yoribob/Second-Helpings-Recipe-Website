const prisma = require('../config/prismaClient')

async function getNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    res.json({ notifications })
  } catch (err) {
    console.error('Get notifications error:', err)
    res.status(500).json({ msg: 'Failed to fetch notifications' })
  }
}

async function markNotificationRead(req, res) {
  try {
    const { id } = req.params
    const notification = await prisma.notification.findUnique({ where: { id } })

    if (!notification || notification.userId !== req.user.userId) {
      return res.status(404).json({ msg: 'Notification not found' })
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true }
    })

    res.json({ msg: 'Notification marked as read' })
  } catch (err) {
    console.error('Mark notification read error:', err)
    res.status(500).json({ msg: 'Failed to update notification' })
  }
}

module.exports = { getNotifications, markNotificationRead }