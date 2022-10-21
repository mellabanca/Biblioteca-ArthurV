import React, {Component} from "react";
import { StyleSheet, Text, View } from "react-native";

export default class SearchScreen extends Component{
    render(){
        return(
            <View style={styles.container}>
                <Text style = {styles.text}>Pesquise o livro de seu interesse.</Text>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#5653D4"
    },
    text: {
        color: "#FFF",
        fontSize: 30
    }
})