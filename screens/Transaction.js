import React, {Component} from "react";
import { StyleSheet, Text, View } from "react-native";

export default class TransactionScreen extends Component{
    render(){
        return(
            <View style={styles.container}>
                <Text style = {styles.text}>Empreste ou devolva o livro que lhe foi emprestado.</Text>
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