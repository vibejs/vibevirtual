import { RowData, Table, TableFeatures, TableOptions, TableState } from "@tanstack/table-core";
import { Component, ComponentProps, Handle, MaybeRef, MaybeRefOrGetter } from "@usevibejs/ui";
import { Atom, Atom as Atom$1, ReadonlyAtom, Subscription } from "@tanstack/store";
import { TableReactivityBindings } from "@tanstack/table-core/reactivity";
export * from "@tanstack/table-core";
/** Each controlled slice can independently be a ref, computed value, or getter. */
type ReactiveTableState<TFeatures extends TableFeatures> = { readonly [K in keyof TableState<TFeatures>]?: MaybeRefOrGetter<TableState<TFeatures>[K]>; };
type StaticOption = 'features' | 'atoms' | 'initialState';
type SourceOption = 'data' | 'columns' | 'state';
/** Callbacks remain callbacks. Use a whole-options getter for reactive scalar options. */
type UseTableOptions<TFeatures extends TableFeatures, TData extends RowData> = { readonly [K in keyof Omit<TableOptions<TFeatures, TData>, StaticOption | SourceOption>]: MaybeRef<TableOptions<TFeatures, TData>[K]>; } & Pick<TableOptions<TFeatures, TData>, StaticOption> & {
  readonly data: MaybeRefOrGetter<ReadonlyArray<TData>>;
  readonly columns: MaybeRefOrGetter<TableOptions<TFeatures, TData>['columns']>;
  readonly state?: MaybeRefOrGetter<ReactiveTableState<TFeatures>>;
};
/**
 * Constructs one stable headless table, owned by the current component/effect scope.
 * Read table/row/column methods inside templates, computed values, or watchers to track them.
 * Data and columns use reference replacement, following TanStack's memoization contract.
 */
export declare function useTable<TFeatures extends TableFeatures, TData extends RowData>(options: MaybeRefOrGetter<UseTableOptions<TFeatures, TData>>): Table<TFeatures, TData>;
/** Creates native atoms owned by the active Vibe effect scope. */
export declare function vibeReactivity(): TableReactivityBindings;
/** An externally owned native state slice. Create it in the same scope as its table. */
export declare function useTableAtom<T>(initialValue: T): Atom$1<T>;
/** The only prop passed to a registered cell/header component. */
interface TableComponentProps<TContext extends object> {
  context: TContext;
}
/** A declarative component selection, rendered with <component :is> by the consumer. */
interface ComponentContent {
  readonly kind: 'component';
  readonly component: Component;
  readonly context: object;
}
type TextContent = string | number | bigint | boolean | null | undefined;
type TableContent = TextContent | ComponentContent;
/**
 * Checks a .vibe component's context and all required props at registration time.
 * Pass the result directly as column.cell/header. No mounting or DOM work happens here.
 */
export declare function componentRenderer<C extends Component<(props: {
  context: never;
}) => Handle<unknown, unknown, unknown>>>(component: C): (context: ComponentProps<C> extends {
  context: infer T extends object;
} ? T : never) => ComponentContent;
/** Evaluates a text template or registered component without interpreting strings as HTML. */
export declare function renderContent<TContext extends object>(template: TextContent | ((context: TContext) => unknown), context: TContext): TableContent;
/** Narrows content for declarative dynamic-component outlets. */
export declare function isComponentContent(content: TableContent): content is ComponentContent;
export type { Atom, ComponentContent, ReactiveTableState, ReadonlyAtom, Subscription, TableComponentProps, TableContent, TextContent, UseTableOptions };
//# sourceMappingURL=index.d.ts.map