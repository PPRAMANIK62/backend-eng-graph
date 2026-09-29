---
id: protobuf-best-practices
title: Proto Best Practices
author: Google (Protocol Buffers team)
url: https://protobuf.dev/best-practices/dos-donts/
kind: docs
primary: true
---

## Summary

Google's list of dos and don'ts for writing `.proto` files, most of
them about keeping old and new versions compatible. A living doc with
no version on the page.

## Key claims

- Clients and servers never upgrade at the same moment. "Clients and servers are never updated at exactly the same time - even when you try to update them at the same time." (intro)
- One may be rolled back, so don't count on them being in sync. "Don’t assume that you can make a breaking change and it’ll be okay because the client and server are in sync." (intro)
- Never reuse a tag number: old data may still be in a log. "If the change was live ever, there could be serialized versions of your proto in a log somewhere." (Don’t Re-use a Tag Number)
- Renaming an enum value safely takes three steps: add the new name below the old and deprecate the old; once all parsers have it, swap the order; once all serializers have it, delete the old name. (Do Put New Enum Aliases Last)
- Don't change a field's type, even where the bytes still parse. "changing a field’s type can be difficult to roll out safely even when the new schema can successfully parse old data." (Don’t Change the Type of a Field)
- A required field can outlive its purpose and get filled with empty values. "whether someone will be forced to fill in your required field with an empty string or zero in four years when it’s no longer logically required but the proto still says it is." (Don’t Add a Required Field)
- Required fields were removed from proto3. "Required fields are considered harmful by so many they were removed from proto3 completely." (Don’t Add a Required Field)
- The first enum value should be an UNSPECIFIED zero, because old clients see new values as unset. "When new values are added to an enum, old clients will see the field as unset and the getter will return the default value or the first-declared value if no default exists ." (Do Include an Unspecified Value in an Enum)
- Changing a default causes version skew. "A client reading an unset value will see a different result than a server reading the same unset value when their builds straddle the proto change." (Don’t Change the Default Value of a Field)
- Repeated to scalar loses data. "Although it won’t cause crashes, you’ll lose data." (Don’t Go from Repeated to Scalar)

## Visuals worth redrawing

None.

## My notes

- The enum-alias steps are a small example of "readers first, then
  writers", the same rule Avro unions follow.
