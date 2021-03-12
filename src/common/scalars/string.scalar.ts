import { CustomScalar, Scalar } from '@nestjs/graphql';
import { ValueNode, Kind } from 'graphql';

@Scalar('String250', (type) => String)
export class String250Scalar implements CustomScalar<string, string> {
  description = 'Value of type string with 250-character maximum length';

  parseValue(value: string): string {
    return value.substr(0, 250);
  }

  serialize(value: string): string {
    return value;
  }

  parseLiteral(value: ValueNode): string {
    if (value.kind === Kind.INT) {
      return value.value.toString();
    }

    return null;
  }
}
