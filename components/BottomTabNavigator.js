import React, {Component} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import TransactionScreen from "../screens/Transaction";
import SearchScreen from "../screens/Search";

var tab = createBottomTabNavigator();

export default class BottomTabNavigator extends Component {
    render(){
        return(
            <NavigationContainer>
                <tab.Navigator>
                    <tab.Screen name="Transação" component={TransactionScreen}/>
                    <tab.Screen name="Pesquisa" component={SearchScreen}/>
                </tab.Navigator>
            </NavigationContainer>
        )
    }
}