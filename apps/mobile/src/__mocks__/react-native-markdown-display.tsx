// Mock de react-native-markdown-display pour les tests Jest.
// Rend le contenu Markdown brut dans un <Text> pour permettre les assertions.
import React from 'react'
import { Text } from 'react-native'

interface MarkdownProps {
  children: string
  style?: Record<string, unknown>
}

const Markdown = ({ children }: MarkdownProps) => <Text testID="markdown-content">{children}</Text>

export default Markdown
