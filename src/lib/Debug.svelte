<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
   export let data = {}
   export let store = undefined
</script>

<pre>
  {JSON.stringify(store ? $store : data, null, 4)}
</pre>