# @capgo/capacitor-pretty-toast

Native-first pretty toast notifications for Capacitor and the web.

## Demo

<img
  src="./media/pretty-toast-demo.webp"
  alt="Animated Pretty Toast demo showing Android cutout and centered island-style toast flows side by side"
/>

This package keeps the familiar `toast.*` surface from `react-native-pretty-toast`, but ships as a Capacitor plugin with:

- native overlays on iOS and Android.
- a DOM renderer on web.
- queueing, `force`, `update`, `dismiss`, `dismissAll`, and `promise`
- symbol icons, raw SVG through `icon`, and URI-based images through `iconSource`

## Install

```bash
bun add @capgo/capacitor-pretty-toast
```

Then sync native platforms:

```bash
bunx cap sync
```

## Usage

```ts
import { toast } from '@capgo/capacitor-pretty-toast';

toast.success('Saved', {
  message: 'Your changes are already on disk.',
});

const id = toast.loading('Uploading', {
  message: 'This toast stays visible until you update it.',
});

setTimeout(() => {
  toast.update(id, {
    title: 'Upload complete',
    message: 'Updated in place without replaying the enter animation.',
    icon: 'checkmark.circle.fill',
    autoDismiss: true,
  });
}, 1500);
```

## API

<docgen-index>

* [`show(...)`](#show)
* [`success(...)`](#success)
* [`error(...)`](#error)
* [`info(...)`](#info)
* [`warning(...)`](#warning)
* [`loading(...)`](#loading)
* [`update(...)`](#update)
* [`promise(...)`](#promise)
* [`dismiss(...)`](#dismiss)
* [`dismissAll()`](#dismissall)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

Public toast controller exposed as `toast`.

### show(...)

```typescript
show(config: ToastConfig, options?: ShowOptions | undefined) => string
```

Show a custom toast and return its id.

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`config`**  | <code><a href="#toastconfig">ToastConfig</a></code> |
| **`options`** | <code><a href="#showoptions">ShowOptions</a></code> |

**Returns:** <code>string</code>

--------------------


### success(...)

```typescript
success(title: string, config?: ToastConfig | undefined, options?: ShowOptions | undefined) => string
```

Show a success toast.

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`title`**   | <code>string</code>                                 |
| **`config`**  | <code><a href="#toastconfig">ToastConfig</a></code> |
| **`options`** | <code><a href="#showoptions">ShowOptions</a></code> |

**Returns:** <code>string</code>

--------------------


### error(...)

```typescript
error(title: string, config?: ToastConfig | undefined, options?: ShowOptions | undefined) => string
```

Show an error toast.

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`title`**   | <code>string</code>                                 |
| **`config`**  | <code><a href="#toastconfig">ToastConfig</a></code> |
| **`options`** | <code><a href="#showoptions">ShowOptions</a></code> |

**Returns:** <code>string</code>

--------------------


### info(...)

```typescript
info(title: string, config?: ToastConfig | undefined, options?: ShowOptions | undefined) => string
```

Show an informational toast.

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`title`**   | <code>string</code>                                 |
| **`config`**  | <code><a href="#toastconfig">ToastConfig</a></code> |
| **`options`** | <code><a href="#showoptions">ShowOptions</a></code> |

**Returns:** <code>string</code>

--------------------


### warning(...)

```typescript
warning(title: string, config?: ToastConfig | undefined, options?: ShowOptions | undefined) => string
```

Show a warning toast.

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`title`**   | <code>string</code>                                 |
| **`config`**  | <code><a href="#toastconfig">ToastConfig</a></code> |
| **`options`** | <code><a href="#showoptions">ShowOptions</a></code> |

**Returns:** <code>string</code>

--------------------


### loading(...)

```typescript
loading(title: string, config?: ToastConfig | undefined, options?: ShowOptions | undefined) => string
```

Show a loading toast. Loading toasts do not auto-dismiss by default.

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`title`**   | <code>string</code>                                 |
| **`config`**  | <code><a href="#toastconfig">ToastConfig</a></code> |
| **`options`** | <code><a href="#showoptions">ShowOptions</a></code> |

**Returns:** <code>string</code>

--------------------


### update(...)

```typescript
update(id: string, partial: ToastConfig) => void
```

Update an existing toast by id.

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`id`**      | <code>string</code>                                 |
| **`partial`** | <code><a href="#toastconfig">ToastConfig</a></code> |

--------------------


### promise(...)

```typescript
promise<T>(promise: Promise<T>, messages: PromiseMessages<T>) => Promise<T>
```

Show a loading toast while a promise is pending, then update it for success or error.

| Param          | Type                                                                 |
| -------------- | -------------------------------------------------------------------- |
| **`promise`**  | <code>Promise&lt;T&gt;</code>                                        |
| **`messages`** | <code><a href="#promisemessages">PromiseMessages</a>&lt;T&gt;</code> |

**Returns:** <code>Promise&lt;T&gt;</code>

--------------------


### dismiss(...)

```typescript
dismiss(id?: string | undefined) => void
```

Dismiss one toast by id, or the current toast when no id is provided.

| Param    | Type                |
| -------- | ------------------- |
| **`id`** | <code>string</code> |

--------------------


### dismissAll()

```typescript
dismissAll() => void
```

Dismiss the current toast and clear the queue.

--------------------


### Interfaces


#### ToastConfig

| Prop                            | Type                                                | Description                                                                                                                                                            |
| ------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`id`**                        | <code>string</code>                                 | Optional stable toast id. A generated id is returned when omitted.                                                                                                     |
| **`icon`**                      | <code>string</code>                                 | Accepts either an SF-symbol-like identifier or raw SVG markup. SVG mode is enabled only when the string starts with `&lt;svg` after trim.                              |
| **`iconSource`**                | <code><a href="#iconsource">IconSource</a></code>   | URI-like image source. Supports `https://`, `http://`, `file://`, absolute file paths, `data:` URLs, `blob:` URLs, or `{ uri }`. `iconSource` always wins over `icon`. |
| **`title`**                     | <code>string</code>                                 | Main toast title.                                                                                                                                                      |
| **`message`**                   | <code>string</code>                                 | Secondary toast message.                                                                                                                                               |
| **`duration`**                  | <code>number</code>                                 | Auto-dismiss delay in milliseconds.                                                                                                                                    |
| **`autoDismiss`**               | <code>boolean</code>                                | Whether the toast dismisses itself after `duration`.                                                                                                                   |
| **`enableSwipeDismiss`**        | <code>boolean</code>                                | Whether swipe-to-dismiss is enabled on native overlays.                                                                                                                |
| **`accentColor`**               | <code>string</code>                                 | CSS-style accent color used by native/web renderers.                                                                                                                   |
| **`strokeColor`**               | <code>string</code>                                 | CSS-style border/stroke color.                                                                                                                                         |
| **`disableBackdropSampling`**   | <code>boolean</code>                                | Disable Android/iOS backdrop sampling behind the toast.                                                                                                                |
| **`action`**                    | <code><a href="#toastaction">ToastAction</a></code> | Optional action button configuration.                                                                                                                                  |
| **`accessibilityAnnouncement`** | <code>string</code>                                 | Text announced to assistive technologies when the toast is shown.                                                                                                      |
| **`onPress`**                   | <code>(() =&gt; void)</code>                        | Called when the toast body is pressed.                                                                                                                                 |
| **`onShow`**                    | <code>(() =&gt; void)</code>                        | Called when the toast becomes visible.                                                                                                                                 |
| **`onHide`**                    | <code>(() =&gt; void)</code>                        | Called when the toast is dismissed.                                                                                                                                    |
| **`onAutoDismiss`**             | <code>(() =&gt; void)</code>                        | Called when the toast is dismissed by its timer.                                                                                                                       |


#### ToastAction

| Prop          | Type                       | Description                                  |
| ------------- | -------------------------- | -------------------------------------------- |
| **`label`**   | <code>string</code>        | Text shown for the native/web action button. |
| **`onPress`** | <code>() =&gt; void</code> | Called when the action button is pressed.    |


#### ShowOptions

| Prop        | Type                 | Description                                              |
| ----------- | -------------------- | -------------------------------------------------------- |
| **`force`** | <code>boolean</code> | Dismiss the current toast and show this one immediately. |


### Type Aliases


#### IconSource

<code>string | { uri: string }</code>


#### PromiseMessages

<code>{ loading: string | <a href="#toastconfig">ToastConfig</a>; success: string | ((value: T) =&gt; string | <a href="#toastconfig">ToastConfig</a>); error: string | ((error: unknown) =&gt; string | <a href="#toastconfig">ToastConfig</a>); }</code>

</docgen-api>

Notes:

- Raw SVG is accepted only through `icon`.
- `iconSource` always takes precedence over `icon`.
- `toast.loading()` defaults `autoDismiss` to `false`.

## Example App

The repo includes [`example-app/`](./example-app), a Vite-based Capacitor app with demos for:

- every `toast.*` method
- queueing and `force`
- live `update`
- `dismiss` and `dismissAll`
- `promise`
- symbol icons
- raw SVG icons
- remote and data-URL `iconSource` values
- repeatable capture modes with `?demo=hero`, `?demo=flow`, and `?demo=update`

`?demo=flow` is the promo enter/exit morph used in the README video.
The shipped video shows both the Android cutout path and the centered island-style path side by side.

Run it locally:

```bash
cd example-app
bun install
bun run start
```

## Development

```bash
bun install
bun run build
bun test
bun run verify
```
