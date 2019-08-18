import { Evaluation as EvaluationType, Frame as FrameType, Locals, RuntimeObject as RuntimeObjectType } from './interpreter'
import { Catch as CatchNode, Class as ClassNode, ClassMember, Constructor as ConstructorNode, Describe as DescribeNode, DescribeMember as DescribeMemberNode, Entity, Environment as EnvironmentNode, Expression, Field as FieldNode, Fixture as FixtureNode, Id, Import as ImportNode, Kind, Linked, List, Literal as LiteralNode, LiteralValue, Method as MethodNode, Mixin as MixinNode, Name, NamedArgument as NamedArgumentNode, New as NewNode, Node, NodeOfKind, ObjectMember, Package as PackageNode, Parameter as ParameterNode, Program as ProgramNode, Raw, Reference as ReferenceNode, Sentence, Singleton as SingletonNode, Test as TestNode, Variable as VariableNode } from './model'

const { keys } = Object

type NodePayload<N extends Node<any>> = Omit<N, 'kind'>

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// NODES
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const makeNode = <K extends Kind, N extends NodeOfKind<K, Raw>>(kind: K) => (payload: NodePayload<N>): NodePayload<N> & { kind: K } =>
  ({ ...payload, kind })

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// COMMON
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const Reference = (name: Name) => makeNode('Reference')({ name })

export const Parameter = (name: Name, payload?: Partial<NodePayload<ParameterNode<Raw>>>) => makeNode('Parameter')({
  name,
  isVarArg: false,
  ...payload,
})

export const NamedArgument = (name: Name, value: Expression<Raw>) => makeNode('NamedArgument')({
  name,
  value,
})

export const Import = (reference: ReferenceNode<Raw>, payload?: Partial<NodePayload<ImportNode<Raw>>>) => makeNode('Import')({
  reference,
  isGeneric: false,
  ...payload,
})

export const Body = (...sentences: Sentence<Raw>[]) => makeNode('Body')({ sentences })

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// ENTITIES
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const Package = (name: Name, payload?: Partial<NodePayload<PackageNode<Raw>>>) =>
  (...members: Entity<Raw>[]) => makeNode('Package')({
    name,
    members,
    imports: [],
    ...payload,
  })


export const Class = (name: Name, payload?: Partial<NodePayload<ClassNode<Raw>>>) =>
  (...members: ClassMember<Raw>[]) =>
    makeNode('Class')({
      name,
      members,
      mixins: [],
      ...payload,
    })

export const Singleton = (name?: Name, payload?: Partial<NodePayload<SingletonNode<Raw>>>) =>
  (...members: ObjectMember<Raw>[]) =>
    makeNode('Singleton')({
      members,
      mixins: [],
      ...name ? { name } : {},
      ...payload,
    })

export const Mixin = (name: Name, payload?: Partial<NodePayload<MixinNode<Raw>>>) =>
  (...members: ObjectMember<Raw>[]) =>
    makeNode('Mixin')({
      name,
      members,
      mixins: [],
      ...payload,
    })

export const Program = (name: Name, payload?: Partial<NodePayload<ProgramNode<Raw>>>) =>
  (...sentences: Sentence<Raw>[]) =>
    makeNode('Program')({
      name,
      body: Body(...sentences),
      ...payload,
    })

export const Test = (name: string, payload?: Partial<NodePayload<TestNode<Raw>>>) =>
  (...sentences: Sentence<Raw>[]) =>
    makeNode('Test')({
      name,
      body: Body(...sentences),
      ...payload,
    })

export const Describe = (name: string, payload?: Partial<NodePayload<DescribeNode<Raw>>>) =>
  (...members: DescribeMemberNode<Raw>[]) =>
    makeNode('Describe')({
      name,
      members,
      ...payload,
    })

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// MEMBERS
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const Field = (name: Name, payload?: Partial<NodePayload<FieldNode<Raw>>>) => makeNode('Field')({
  name,
  isReadOnly: false,
  isProperty: false,
  ...payload,
})

export const Method = (name: Name, payload?: Partial<NodePayload<MethodNode<Raw>>>) =>
  (...sentences: Sentence<Raw>[]) => {
    const { body, ...otherPayload } = payload || { body: undefined }

    return makeNode('Method')({
      name,
      isOverride: false,
      isNative: false,
      parameters: [],
      ...payload && keys(payload).includes('body') && body === undefined ? {} : {
        body: Body(...sentences),
      },
      ...otherPayload,
    })
  }

export const Constructor = (payload?: Partial<NodePayload<ConstructorNode<Raw>>>) =>
  (...sentences: Sentence<Raw>[]) => makeNode('Constructor')({
    body: Body(...sentences),
    parameters: [],
    ...payload,
  })

export const Fixture = (_?: Partial<NodePayload<FixtureNode<Raw>>>) =>
  (...sentences: Sentence<Raw>[]) =>
    makeNode('Fixture')({
      body: Body(...sentences),
    })

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SENTENCES
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const Variable = (name: Name, payload?: Partial<NodePayload<VariableNode<Raw>>>) => makeNode('Variable')({
  name,
  isReadOnly: false,
  ...payload,
})

export const Return = (value: Expression<Raw> | undefined = undefined) => makeNode('Return')({ value })

export const Assignment = (reference: ReferenceNode<Raw>, value: Expression<Raw>) => makeNode('Assignment')({ reference, value })

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// EXPRESSIONS
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const Self = makeNode('Self')({})

export const Literal = <T extends LiteralValue<Raw>>(value: T) => makeNode<'Literal', LiteralNode<Raw, T>>('Literal')({ value })

export const Send = (receiver: Expression<Raw>, message: Name, args: ReadonlyArray<Expression<Raw>> = []) => makeNode('Send')({
  receiver,
  message,
  args,
})

export const Super = (args: List<Expression<Raw>> = []) => makeNode('Super')({ args })

export const New = (className: ReferenceNode<Raw>, args: List<Expression<Raw>> | List<NamedArgumentNode<Raw>>) =>
  makeNode('New')({ instantiated: className, args })

export const If = (condition: Expression<Raw>, thenBody: List<Sentence<Raw>>, elseBody?: List<Sentence<Raw>>) => makeNode('If')({
  condition,
  thenBody: Body(...thenBody),
  elseBody: elseBody && Body(...elseBody),
})

export const Throw = (arg: Expression<Raw>) => makeNode('Throw')({ exception: arg })

export const Try = (sentences: List<Sentence<Raw>>, payload: {
  catches?: List<CatchNode<Raw>>,
  always?: List<Sentence<Raw>>
}) =>
  makeNode('Try')({
    body: Body(...sentences),
    catches: payload.catches || [],
    always: payload.always && Body(...payload.always),
  })

export const Catch = (parameter: ParameterNode<Raw>, payload?: Partial<NodePayload<CatchNode<Raw>>>) =>
  (...sentences: Sentence<Raw>[]) =>
    makeNode('Catch')({
      body: Body(...sentences),
      parameter,
      ...payload,
    })

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// SYNTHETICS
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const Closure = (...parameters: ParameterNode<Raw>[]) => (...body: Sentence<Raw>[]): LiteralNode<Raw, SingletonNode<Raw>> =>
  Literal(Singleton(undefined, { superCall: { superclass: Reference('wollok.lang.Closure'), args: [] } })(
    Method('<apply>', { parameters })(
      ...body
    )
  ))

export const ListOf = (...elems: Expression<Raw>[]): NewNode<Raw> => ({
  kind: 'New',
  instantiated: {
    kind: 'Reference',
    name: 'wollok.lang.List',
  },
  args: elems,
})

export const SetOf = (...elems: Expression<Raw>[]): NewNode<Raw> => ({
  kind: 'New',
  instantiated: {
    kind: 'Reference',
    name: 'wollok.lang.Set',
  },
  args: elems,
})

export const Environment = (...members: PackageNode<Linked>[]): EnvironmentNode => ({
  members,
  kind: 'Environment',
  id: '',
})

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// UTILS
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const getter = (name: Name): MethodNode<Raw> => Method(name)(Return(Reference(name)))

export const setter = (name: Name): MethodNode<Raw> => Method(name, { parameters: [Parameter('value')] })(
  Assignment(Reference(name), Reference('value'))
)

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// EVALUATION
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const evaluationBuilders = (environment: EnvironmentNode) => {


  const RuntimeObject = (id: Id, module: Name, fields: Locals = {}, innerValue: any = undefined): RuntimeObjectType => ({
    id,
    module,
    fields,
    innerValue,
  })

  const Frame = (payload: Partial<FrameType>): FrameType => ({
    locals: {},
    nextInstruction: 0,
    instructions: [],
    resume: [],
    operandStack: [],
    ...payload,
  })

  const Evaluation = (instances: { [id: string]: RuntimeObjectType } = {}) =>
    (...frameStack: FrameType[]): EvaluationType => ({
      environment,
      instances,
      frameStack: [...frameStack].reverse(),
    })

  return {
    RuntimeObject,
    Frame,
    Evaluation,
  }
}