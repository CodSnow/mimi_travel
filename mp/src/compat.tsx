import React from 'react'
import { View, Text, Button, Image, Input, ScrollView } from '@tarojs/components'

export const Section = (props) => <View {...props} />
export const Article = (props) => <View {...props} />
export const Div = (props) => <View {...props} />
export const Span = (props) => <Text {...props} />
export const H1 = (props) => <Text style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }} {...props} />
export const H2 = (props) => <Text style={{ fontSize: '20px', fontWeight: 'bold', display: 'block' }} {...props} />
export const H3 = (props) => <Text style={{ fontSize: '18px', fontWeight: 'bold', display: 'block' }} {...props} />
export const P = (props) => <View style={{ marginBottom: '10px' }} {...props} />
export const Img = (props) => <Image mode="aspectFill" {...props} />
export const Main = (props) => <View {...props} />
export const Nav = (props) => <View {...props} />
export const Form = (props) => <View {...props} />
export const Label = (props) => <View {...props} />
export const Strong = (props) => <Text style={{ fontWeight: 'bold' }} {...props} />
export const Small = (props) => <Text style={{ fontSize: '12px' }} {...props} />
export const Em = (props) => <Text style={{ fontStyle: 'italic' }} {...props} />
export const I = (props) => <Text {...props} />

// 覆盖默认标签
export const HtmlCompat = {
  section: Section,
  article: Article,
  div: Div,
  span: Span,
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  img: Img,
  main: Main,
  nav: Nav,
  form: Form,
  label: Label,
  strong: Strong,
  small: Small,
  em: Em,
  i: I,
  button: (props) => {
    const { onClick, children, className, style } = props
    return <View onClick={onClick} className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>{children}</View>
  },
  input: (props) => {
    const { onChange, value, ...rest } = props
    return <Input onInput={(e) => onChange?.({ target: { value: e.detail.value } })} value={value} {...rest} />
  }
}
