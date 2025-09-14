import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

const ProjectSelectionScreen: React.FC = () => {
  const handleProjectSelect = (projectName: string) => {
    Alert.alert(
      'Project Selected',
      `You selected: ${projectName}`,
      [
        {
          text: 'Text Chat',
          onPress: () => Alert.alert('Success', 'Text chat mode selected!')
        },
        {
          text: 'Voice Chat', 
          onPress: () => Alert.alert('Success', 'Voice chat mode selected!')
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Project</Text>
      
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => handleProjectSelect('Stratosphere Mobile')}>
        <Text style={styles.projectName}>Stratosphere Mobile</Text>
        <Text style={styles.projectDescription}>React Native mobile app</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => handleProjectSelect('HTN25 Project')}>
        <Text style={styles.projectName}>HTN25 Project</Text>
        <Text style={styles.projectDescription}>Desktop development tool</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => handleProjectSelect('No Project')}>
        <Text style={styles.projectName}>No Project</Text>
        <Text style={styles.projectDescription}>General chat mode</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  projectCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  projectName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 20,
  },
});

export default ProjectSelectionScreen;