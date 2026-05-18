import React, { useState, useCallback } from 'react'
import { View, Text, Pressable } from 'react-native'
import { styles } from './Accordion.styles'
import type { AccordionProps } from './Accordion.types'

export const Accordion = React.memo(function Accordion({ title, subtitle, badge, defaultOpen = false, children, style }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const toggle = useCallback(() => setOpen(o => !o), [])

  return (
    <View style={[styles.container, style]}>
      <Pressable style={styles.trigger} onPress={toggle}>
        <View style={styles.labels}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.meta}>
          {badge !== undefined ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
          <Text style={styles.chevron}>{open ? '›' : '›'}</Text>
        </View>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  )
})
