import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Textarea, TextareaInput } from '@gluestack-ui/themed';
import { Program } from '../../types/program';
import { ViewMode } from '.';

interface DescriptionSectionProps {
  program: Program;
  updateProgramMetadata: (metadata: any) => void;
  mode: ViewMode;
}

const DescriptionSection: React.FC<DescriptionSectionProps> = memo(({ program, updateProgramMetadata, mode }) => {
  const content = useMemo(() => {
    if (mode === ViewMode.CREATE || mode === ViewMode.EDIT) {
      return (
        <Textarea size="md" isReadOnly={false} isInvalid={false} isDisabled={false} width="100%" style={styles.textarea}>
          <TextareaInput
            style={styles.textareaInput}
            color="$white"
            placeholder="Add a brief program description..."
            value={program?.metadata.description}
            onChangeText={text => updateProgramMetadata({ description: text })}
          />
        </Textarea>
      );
    }

    return (
      <Textarea size="md" isReadOnly={true} isInvalid={false} isDisabled={false} style={styles.readOnlyTextarea} width="100%">
        <TextareaInput color="$white" placeholder="No description" value={program?.metadata?.description} />
      </Textarea>
    );
  }, [mode, program?.metadata.description, updateProgramMetadata]);

  return content;
});

const styles = StyleSheet.create({
  textarea: {
    borderRadius: 15,
    fontSize: 14,
  },
  textareaInput: {
    fontSize: 14,
  },
  readOnlyTextarea: {
    borderRadius: 15,
    fontSize: 14,
    borderColor: '#BDBDBDB2',
  },
});

export default DescriptionSection;